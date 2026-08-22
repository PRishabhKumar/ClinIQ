import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This function checks for appointments starting in the next 24 hours
// and schedules a REMINDER notification if one hasn't been created yet.
export const scheduleReminders = async () => {
  console.log('Running reminder scheduling job...');
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find upcoming appointments that are BOOKED
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        slotStart: {
          gt: now,
          lte: twentyFourHoursFromNow
        }
      }
    });

    for (const appt of upcomingAppointments) {
      // Check if a reminder log already exists for this appointment
      const existingReminder = await prisma.notificationLog.findFirst({
        where: {
          appointmentId: appt.id,
          type: 'REMINDER'
        }
      });

      if (!existingReminder) {
        // Create a new reminder notification log
        await prisma.notificationLog.create({
          data: {
            appointmentId: appt.id,
            type: 'REMINDER',
            status: 'PENDING'
          }
        });
        console.log(`Scheduled reminder for appointment ${appt.id}`);
      }
    }
  } catch (error) {
    console.error('Failed to schedule reminders:', error);
  }
};
