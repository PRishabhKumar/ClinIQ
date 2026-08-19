import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

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
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
