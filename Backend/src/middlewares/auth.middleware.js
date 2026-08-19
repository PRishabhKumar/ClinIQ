import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../config/database.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden - Insufficient permissions");
    }
    
    next();
  };
};
