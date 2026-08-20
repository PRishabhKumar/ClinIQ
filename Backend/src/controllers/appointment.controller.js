import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response.js';
import appointmentService from '../services/appointment.service.js';

export const holdSlot = asyncHandler(async (req, res) => {
  const { doctorId, slotStart, slotEnd } = req.body;
  const patientId = req.user.id;

  const appointment = await appointmentService.holdSlot(patientId, doctorId, slotStart, slotEnd);
  res.status(201).json(new ApiResponse(201, appointment, "Slot held successfully"));
});

export const confirmSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  const appointment = await appointmentService.confirmSlot(id, patientId);
  res.status(200).json(new ApiResponse(200, appointment, "Appointment booked successfully"));
});

export const submitSymptoms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;
  const symptomsData = req.body;

  const result = await appointmentService.submitSymptoms(id, patientId, symptomsData);
  res.status(200).json(new ApiResponse(200, result, "Symptoms submitted and appointment booked"));
});
