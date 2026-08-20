import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import doctorService from '../services/doctor.service.js';

export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await doctorService.getDoctors(req.query);
  res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});
