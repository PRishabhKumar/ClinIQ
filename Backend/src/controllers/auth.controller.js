import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { getCalendarAuthUrl, getTokensFromCode } from '../services/calendar.service.js';
import { google } from 'googleapis';

const generateAccessAndRefreshTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation Error", parsed.error.errors);
  }

  const { email, password, name, phone } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      role: 'PATIENT' // Only patients can self-register
    },
    select: { id: true, email: true, name: true, role: true }
  });

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user.id);

  res.status(201).json(new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation Error", parsed.error.errors);
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user.id);

  res.status(200).json(new ApiResponse(200, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, googleId: user.googleId },
    accessToken,
    refreshToken
  }, "Logged in successfully"));
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const tokens = generateAccessAndRefreshTokens(user.id);

    res.status(200).json(new ApiResponse(200, tokens, "Tokens refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

export const logout = asyncHandler(async (req, res) => {
  // Client is expected to discard tokens on logout. 
  // If we had a token blacklist or stored refresh tokens in DB, we'd clear them here.
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export const googleLogin = asyncHandler(async (req, res) => {
  // role = PATIENT | DOCTOR | ADMIN, passed as part of state for validation on callback
  const role = req.query.role || 'PATIENT';
  const returnTo = req.query.returnTo || '';
  const state = encodeURIComponent(JSON.stringify({ role, returnTo }));
  console.log(`[googleLogin] Initiating login for role: ${role}, returnTo: ${returnTo}, raw state: ${JSON.stringify({ role, returnTo })}, encoded state: ${state}`);
  const url = getCalendarAuthUrl(state);
  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, error, state } = req.query;

  const FRONTEND = 'http://localhost:5173';

  if (error) {
    return res.redirect(`${FRONTEND}/login?error=oauth_failed`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND}/login?error=oauth_failed`);
  }

  let parsedState = { role: 'PATIENT', returnTo: '' };
  try {
    if (state) {
      const decoded = decodeURIComponent(state);
      parsedState = JSON.parse(decoded);
      console.log(`[googleCallback] State parsed successfully:`, parsedState);
    } else {
      console.log(`[googleCallback] No state provided.`);
    }
  } catch (err) { 
    console.error(`[googleCallback] Failed to parse state. Raw state: ${state}, Error: ${err.message}`);
  }

  const { role: expectedRole, returnTo } = parsedState;
  console.log(`[googleCallback] Expecting role: ${expectedRole}`);

  try {
    const tokens = await getTokensFromCode(code);

    // Fetch user info from Google
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const { id: googleId, email, name } = userInfo.data;

    // LOGIN-ONLY: Look up user by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] }
    });

    if (!user) {
      if (expectedRole === 'PATIENT') {
        // Auto-register Patient via Google
        user = await prisma.user.create({
          data: {
            email,
            name,
            role: 'PATIENT',
            googleId
          }
        });
      } else {
        // No account found — do NOT auto-register doctors or admins
        return res.redirect(`${FRONTEND}/login/${expectedRole.toLowerCase()}?error=no_account&email=${encodeURIComponent(email)}`);
      }
    }

    // Role mismatch — user exists but tried to log in with wrong role button
    if (user.role !== expectedRole) {
      return res.redirect(`${FRONTEND}/login/${expectedRole.toLowerCase()}?error=unauthorized_role&expectedRole=${expectedRole}&actualRole=${user.role}&email=${encodeURIComponent(email)}`);
    }

    // Correct role — update Google credentials (googleId link + refresh token)
    const updateData = {};
    if (!user.googleId) updateData.googleId = googleId;
    if (tokens.refresh_token) updateData.googleRefreshToken = tokens.refresh_token;

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updateData });
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user.id);
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, googleId: user.googleId };

    return res.redirect(
      `${FRONTEND}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(safeUser))}&returnTo=${encodeURIComponent(returnTo)}`
    );

  } catch (err) {
    console.error("Google Auth Error:", err);
    return res.redirect(`${FRONTEND}/login?error=oauth_failed`);
  }
});
