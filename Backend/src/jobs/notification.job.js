import { PrismaClient } from '@prisma/client';
import {
  sendBookingConfirmation,
  sendCancellation,
  sendLeaveConflict
} from '../services/email.service.js';

const prisma = new PrismaClient();

// This function could be called periodically (e.g. by node-cron) or by a worker processing a queue (e.g. BullMQ)
// For simplicity in a custom job runner, we can just run this logic in a setInterval or similar if no job queue is set up.
export const processNotifications = async () => {
  console.log('Running notification processing job...');
  try {
    const pendingLogs = await prisma.notificationLog.findMany({
      where: {
        status: 'PENDING',
        attempts: { lt: 3 } // Max 3 attempts
      },
      take: 50 // process in batches
    });

    for (const log of pendingLogs) {
      try {
        // Fetch the associated appointment with related data
        const appointment = await prisma.appointment.findUnique({
          where: { id: log.appointmentId },
          include: {
            patient: true,
            doctor: {
              include: { user: true }
            }
          }
        });

        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Attach patient email from the patient user object
        appointment.patientEmail = appointment.patient.email;

        // Send email based on type
        switch (log.type) {
          case 'BOOKING_CONFIRMATION':
            await sendBookingConfirmation(appointment);
            break;
          case 'CANCELLATION':
            await sendCancellation(appointment);
            break;
          case 'LEAVE_CONFLICT':
            await sendLeaveConflict(appointment);
            break;
          case 'REMINDER':
            // TODO: Implement reminder email logic in email service
            console.log(`Reminder email to be sent for appointment ${appointment.id}`);
            break;
          default:
            console.warn(`Unknown notification type: ${log.type}`);
        }

        // Mark as sent
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'SENT' }
        });

      } catch (error) {
        console.error(`Error processing notification ${log.id}:`, error);
        // Increment attempts
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            attempts: { increment: 1 },
            status: log.attempts + 1 >= 3 ? 'FAILED' : 'PENDING'
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch pending notifications:', error);
  }
};
