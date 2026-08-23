import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

class AppointmentService {
  async holdSlot(patientId, doctorId, slotStart, slotEnd) {
    try {
      const holdExpiresAt = new Date(Date.now() + 8 * 60000); // 8 minutes hold

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          slotStart: new Date(slotStart),
          slotEnd: new Date(slotEnd),
          status: 'HELD',
          holdExpiresAt
        }
      });

      return appointment;
    } catch (error) {
      // P2010 is the raw query failed code, which triggers when the exclusion constraint fails
      // We also check for P2002 (unique constraint) just in case
      if (error.code === 'P2010' || error.message.includes('no_overlapping_appointments')) {
        throw new ApiError(409, "Slot no longer available");
      }
      throw error;
    }
  }

  async confirmSlot(appointmentId, patientId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: 'HELD'
      }
    });

    if (!appointment) {
      throw new ApiError(404, "Held appointment not found");
    }

    if (new Date() > new Date(appointment.holdExpiresAt)) {
      throw new ApiError(400, "Hold expired");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'BOOKED',
        holdExpiresAt: null // clear the hold
      }
    });

    return updated;
  }

  async submitSymptoms(appointmentId, patientId, symptomsData) {
    console.log(`[submitSymptoms] Start for appointment: ${appointmentId}, patient: ${patientId}`);
    
    // 1. Verify appointment is HELD and belongs to patient
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: 'HELD'
      }
    });

    console.log(`[submitSymptoms] Found appointment:`, !!appointment);

    if (!appointment) {
      throw new ApiError(404, "Held appointment not found or already booked/expired");
    }

    if (new Date() > new Date(appointment.holdExpiresAt)) {
      throw new ApiError(400, "Hold expired");
    }

    // 2. Save symptoms
    const { rawText, durationDays, severity } = symptomsData;
    
    console.log(`[submitSymptoms] Upserting symptom form...`);
    await prisma.symptomForm.upsert({
      where: { appointmentId },
      update: {
        rawText,
        durationDays: durationDays ? parseInt(durationDays) : null,
        severity
      },
      create: {
        appointmentId,
        rawText,
        durationDays: durationDays ? parseInt(durationDays) : null,
        severity
      }
    });
    console.log(`[submitSymptoms] Symptom form upserted.`);

    // 3. Call LLM (with timeout wrapper)
    const llmService = (await import('./llm.service.js')).default;
    
    // Create a 8-second timeout promise for the LLM call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('LLM Timeout')), 8000)
    );

    let summaryData = null;
    let status = 'OK';
    let rawResponse = null;

    try {
      console.log(`[submitSymptoms] Calling LLM...`);
      // Race the actual LLM call against the 8s timeout
      const llmResult = await Promise.race([
        llmService.generatePreVisitSummary(rawText),
        timeoutPromise
      ]);
      console.log(`[submitSymptoms] LLM returned. Success: ${llmResult.success}`);

      if (llmResult.success) {
        summaryData = llmResult.data;
        rawResponse = llmResult.rawLlmResponse;
      } else {
        status = 'FAILED';
      }
    } catch (error) {
      console.error('[submitSymptoms] LLM call failed or timed out:', error.message);
      status = 'FAILED';
    }

    // 4. Save PreVisitSummary (whether success or fail)
    console.log(`[submitSymptoms] Upserting PreVisitSummary with status: ${status}`);
    await prisma.preVisitSummary.upsert({
      where: { appointmentId },
      update: {
        urgency: summaryData?.urgency?.toUpperCase() || null,
        chiefComplaint: summaryData?.chiefComplaint || null,
        suggestedQuestions: summaryData?.suggestedQuestions || [],
        status,
        rawLlmResponse: rawResponse ? JSON.parse(JSON.stringify(rawResponse)) : null,
        generatedAt: status === 'OK' ? new Date() : null
      },
      create: {
        appointmentId,
        urgency: summaryData?.urgency?.toUpperCase() || null,
        chiefComplaint: summaryData?.chiefComplaint || null,
        suggestedQuestions: summaryData?.suggestedQuestions || [],
        status,
        rawLlmResponse: rawResponse ? JSON.parse(JSON.stringify(rawResponse)) : null,
        generatedAt: status === 'OK' ? new Date() : null
      }
    });
    console.log(`[submitSymptoms] PreVisitSummary upserted.`);

    // 5. Confirm the slot
    console.log(`[submitSymptoms] Updating appointment status to BOOKED...`);
    let bookedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'BOOKED',
        holdExpiresAt: null
      },
      include: {
        doctor: {
          include: { user: true }
        },
        patient: true
      }
    });

    // 6. Create Google Calendar Events (Doctor + Patient)
    try {
      const calendarService = await import('./calendar.service.js');
      const calendarAppt = {
        id: bookedAppointment.id,
        doctor: bookedAppointment.doctor,
        patientEmail: bookedAppointment.patient.email,
        startTime: bookedAppointment.slotStart.toISOString(),
        endTime: bookedAppointment.slotEnd.toISOString()
      };

      const doctorRefreshToken = bookedAppointment.doctor.user.googleRefreshToken;
      const patientRefreshToken = bookedAppointment.patient.googleRefreshToken;

      const calendarUpdates = {};

      // Doctor's calendar
      if (doctorRefreshToken) {
        try {
          const event = await calendarService.createEvent(calendarAppt, doctorRefreshToken);
          if (event?.id) {
            calendarUpdates.googleEventId = event.id;
            console.log(`[submitSymptoms] Created doctor calendar event: ${event.id}`);
          }
        } catch (e) {
          console.error('[submitSymptoms] Doctor calendar sync failed:', e.message);
        }
      }

      // Patient's calendar
      if (patientRefreshToken) {
        try {
          const event = await calendarService.createEvent(calendarAppt, patientRefreshToken);
          if (event?.id) {
            calendarUpdates.patientGoogleEventId = event.id;
            console.log(`[submitSymptoms] Created patient calendar event: ${event.id}`);
          }
        } catch (e) {
          console.error('[submitSymptoms] Patient calendar sync failed:', e.message);
        }
      }

      if (!doctorRefreshToken && !patientRefreshToken) {
        console.log('[submitSymptoms] No Google tokens found for doctor or patient. Skipping calendar sync.');
      }

      // Save event IDs if any were created
      if (Object.keys(calendarUpdates).length > 0) {
        bookedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: calendarUpdates
        });
      }
    } catch (err) {
      console.error("[submitSymptoms] Calendar sync error:", err);
      // Don't fail the booking if calendar sync fails
    }

    console.log(`[submitSymptoms] Completed successfully.`);

    return bookedAppointment;
  }

  async getPatientAppointments(patientId) {
    return await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        },
        preVisitSummary: true
      },
      orderBy: { slotStart: 'asc' }
    });
  }

  async cancelAppointment(appointmentId, patientId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: 'BOOKED'
      },
      include: {
        doctor: {
          include: { user: true }
        },
        patient: true
      }
    });

    if (!appointment) {
      throw new ApiError(404, "Booked appointment not found or cannot be cancelled");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    // Delete Google Calendar Events (Doctor + Patient)
    if (appointment.googleEventId || appointment.patientGoogleEventId) {
      const calendarService = await import('./calendar.service.js');
      const doctorRefreshToken = appointment.doctor.user.googleRefreshToken;
      const patientRefreshToken = appointment.patient?.googleRefreshToken;

      if (appointment.googleEventId && doctorRefreshToken) {
        try {
          await calendarService.deleteEvent(appointment.googleEventId, doctorRefreshToken);
          console.log(`[cancelAppointment] Deleted doctor calendar event: ${appointment.googleEventId}`);
        } catch (err) {
          console.error("[cancelAppointment] Failed to delete doctor calendar event:", err.message);
        }
      }

      if (appointment.patientGoogleEventId && patientRefreshToken) {
        try {
          await calendarService.deleteEvent(appointment.patientGoogleEventId, patientRefreshToken);
          console.log(`[cancelAppointment] Deleted patient calendar event: ${appointment.patientGoogleEventId}`);
        } catch (err) {
          console.error("[cancelAppointment] Failed to delete patient calendar event:", err.message);
        }
      }
    }

    // Create a notification log for the cancellation
    await prisma.notificationLog.create({
      data: {
        appointmentId,
        type: 'CANCELLATION',
        status: 'PENDING'
      }
    });

    return updated;
  }

  async completeAppointment(appointmentId, doctorUserId, clinicalNotes) {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId }
    });

    if (!doctorProfile) {
      throw new ApiError(403, "Not authorized as a doctor");
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorProfile.id,
        status: 'BOOKED'
      }
    });

    if (!appointment) {
      throw new ApiError(404, "Appointment not found or not in BOOKED status");
    }

    // Call LLM for post visit summary
    const llmService = (await import('./llm.service.js')).default;
    let summaryData = null;
    let rawResponse = null;

    try {
      const llmResult = await llmService.generatePostVisitSummary(clinicalNotes);
      if (llmResult.success) {
        summaryData = llmResult.data;
        rawResponse = llmResult.rawLlmResponse;
      } else {
        throw new ApiError(500, "Failed to generate AI summary: " + llmResult.error);
      }
    } catch (error) {
      throw new ApiError(500, "Error generating AI summary: " + error.message);
    }

    // Save PostVisitSummary and mark complete
    const result = await prisma.$transaction(async (tx) => {
      await tx.postVisitSummary.create({
        data: {
          appointmentId,
          clinicalNotes,
          patientSummary: summaryData.patientSummary,
          medicationSchedule: summaryData.medicationSchedule,
          followUpSteps: summaryData.followUpSteps,
          rawLlmResponse: rawResponse ? JSON.parse(JSON.stringify(rawResponse)) : null,
          generatedAt: new Date()
        }
      });

      return await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
        include: { postVisitSummary: true }
      });
    });

    return result;
  }
}

export default new AppointmentService();
