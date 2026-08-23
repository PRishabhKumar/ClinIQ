import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import doctorService from '../services/doctor.service.js';

export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await doctorService.getDoctors(req.query);
  res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});

export const getAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json(new ApiResponse(400, null, "Date is required (YYYY-MM-DD)"));
  }

  const slots = await doctorService.getAvailability(id, date);
  res.status(200).json(new ApiResponse(200, slots, "Available slots fetched successfully"));
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query; // optional
  const appointments = await doctorService.getDoctorAppointments(userId, date);
  res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched successfully"));
});
