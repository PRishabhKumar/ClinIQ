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
    const bookedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'BOOKED',
        holdExpiresAt: null
      }
    });
    console.log(`[submitSymptoms] Completed successfully.`);

    return bookedAppointment;
  }
}

export default new AppointmentService();
