import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import doctorService from '../services/doctor.service.js';

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
