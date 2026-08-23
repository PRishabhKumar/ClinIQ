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

export const getMyAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const appointments = await appointmentService.getPatientAppointments(patientId);
  res.status(200).json(new ApiResponse(200, appointments, "Appointments fetched successfully"));
});

export const cancelMyAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;
  
  const result = await appointmentService.cancelAppointment(id, patientId);
  res.status(200).json(new ApiResponse(200, result, "Appointment cancelled successfully"));
});

export const completeAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorUserId = req.user.id;
  const { clinicalNotes } = req.body;
  
  if (!clinicalNotes) {
    return res.status(400).json(new ApiResponse(400, null, "Clinical notes are required"));
  }

  const result = await appointmentService.completeAppointment(id, doctorUserId, clinicalNotes);
  res.status(200).json(new ApiResponse(200, result, "Appointment completed and summary generated"));
});
