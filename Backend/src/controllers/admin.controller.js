import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import doctorService from '../services/doctor.service.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

export const addLeaveDay = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, reason, confirm } = req.body;

  if (!date) {
    return res.status(400).json(new ApiResponse(400, null, "Date is required (YYYY-MM-DD)"));
  }

  const result = await doctorService.addLeaveDay(id, date, reason, confirm);
  
  if (!confirm && result.conflicts && result.conflicts.length > 0) {
    return res.status(409).json(new ApiResponse(409, result, "Leave day has conflicts with booked appointments. Please confirm."));
  }

  res.status(200).json(new ApiResponse(200, result, "Leave day added successfully"));
});

export const removeLeaveDay = asyncHandler(async (req, res) => {
  const { id, leaveId } = req.params;
  const result = await doctorService.removeLeaveDay(id, leaveId);
  res.status(200).json(new ApiResponse(200, result, "Leave day removed successfully"));
});

// ─── User Management ────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: ['PATIENT', 'DOCTOR'] } },
    select: {
      id: true, email: true, name: true, phone: true, role: true, createdAt: true,
      googleId: true,
      doctorProfile: {
        select: { id: true, specializations: true, slotDurationMin: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const createUser = asyncHandler(async (req, res) => {
  const { email, name, phone, role, password, specializations, slotDurationMin } = req.body;

  if (!email || !name || !role) {
    throw new ApiError(400, "email, name, and role are required");
  }
  if (!['PATIENT', 'DOCTOR'].includes(role)) {
    throw new ApiError(400, "role must be PATIENT or DOCTOR");
  }
  if (role === 'DOCTOR' && (!specializations || !slotDurationMin)) {
    throw new ApiError(400, "Doctors require specializations and slotDurationMin");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  // Password is optional — if not provided, the user must log in via Google SSO
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email, name, phone, role, passwordHash }
    });

    if (role === 'DOCTOR') {
      await tx.doctorProfile.create({
        data: {
          userId: newUser.id,
          specializations: specializations || [],
          slotDurationMin: parseInt(slotDurationMin) || 30
        }
      });
    }

    return newUser;
  });

  res.status(201).json(new ApiResponse(201, {
    id: user.id, email: user.email, name: user.name, role: user.role
  }, "User created successfully"));
});

export const removeUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === 'ADMIN') throw new ApiError(403, "Cannot remove an admin account");

  await prisma.user.delete({ where: { id } });
  res.status(200).json(new ApiResponse(200, null, "User removed successfully"));
});
