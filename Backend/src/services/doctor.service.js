import prisma from '../config/database.js';

class DoctorService {
  async getDoctors(query) {
    const { specialization } = query;
    
    const filters = {};
    if (specialization) {
      filters.specializations = {
        has: specialization
      };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: filters,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return doctors;
  }

  async getAvailability(doctorId, dateString) {
    const date = new Date(dateString);
    const weekday = date.getDay();

    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Check if it's a leave day
    const leaveDay = await prisma.leaveDay.findFirst({
      where: {
        doctorId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    if (leaveDay) {
      return []; // Doctor is on leave
    }

    // 2. Get working hours for the specific day of the week
    const workingHours = await prisma.workingHour.findFirst({
      where: {
        doctorId,
        weekday
      }
    });

    if (!workingHours) {
      return []; // Doesn't work on this day
    }

    // 3. Get doctor profile to know slot duration
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId }
    });

    if (!doctorProfile) {
      throw new Error('Doctor not found');
    }

    const slotDurationMin = doctorProfile.slotDurationMin;

    // 4. Generate all possible slots for the day
    const slots = [];
    const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
    
    let currentSlot = new Date(dateString);
    currentSlot.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(dateString);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentSlot.getTime() + slotDurationMin * 60000 <= endTime.getTime()) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + slotDurationMin * 60000);
      
      slots.push({
        slotStart,
        slotEnd,
        available: true
      });

      // Move to next slot
      currentSlot = slotEnd;
    }

    // 5. Check existing booked/held appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ['HELD', 'BOOKED'] },
        slotStart: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    // 6. Filter out unavailable slots
    existingAppointments.forEach(appt => {
      const apptStart = appt.slotStart.getTime();
      const apptEnd = appt.slotEnd.getTime();
      
      slots.forEach(slot => {
        const slotStart = slot.slotStart.getTime();
        const slotEnd = slot.slotEnd.getTime();
        
        // If there's an overlap
        if (slotStart < apptEnd && slotEnd > apptStart) {
          slot.available = false;
        }
      });
    });

    return slots.filter(s => s.available);
  }

  async addLeaveDay(doctorId, dateString, reason, confirm) {
    const date = new Date(dateString);
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999);

    // Find conflicting BOOKED appointments
    const conflicts = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'BOOKED',
        slotStart: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!confirm) {
      return { conflicts };
    }

    // Wrap in transaction if confirmed
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create leave day
      const leaveDay = await tx.leaveDay.create({
        data: {
          doctorId,
          date: startOfDay,
          reason
        }
      });

      // 2. Mark conflicting appointments as LEAVE_CANCELLED
      if (conflicts.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: { in: conflicts.map(c => c.id) }
          },
          data: { status: 'LEAVE_CANCELLED' }
        });

        // 3. Create NotificationLog entries for each
        const notifications = conflicts.map(c => ({
          appointmentId: c.id,
          type: 'LEAVE_CONFLICT',
          status: 'PENDING',
        }));

        await tx.notificationLog.createMany({
          data: notifications
        });
      }

      return { leaveDay, conflictsCancelled: conflicts };
    });

    // Outside transaction, delete calendar events
    if (result.conflictsCancelled && result.conflictsCancelled.length > 0) {
      try {
        const doctorProfile = await prisma.doctorProfile.findUnique({
          where: { id: doctorId },
          include: { user: true }
        });
        const refreshToken = doctorProfile?.user?.googleRefreshToken;

        const calendarService = await import('./calendar.service.js');
        for (const c of result.conflictsCancelled) {
          if (c.googleEventId) {
            await calendarService.deleteEvent(c.googleEventId, refreshToken).catch(err => 
              console.error(`[addLeaveDay] Failed to delete calendar event ${c.googleEventId}:`, err)
            );
          }
        }
      } catch (err) {
        console.error("[addLeaveDay] Failed to initialize calendar service:", err);
      }
    }

    return { leaveDay: result.leaveDay, conflictsCancelled: result.conflictsCancelled.length };
  }

  async removeLeaveDay(doctorId, leaveId) {
    const leaveDay = await prisma.leaveDay.findUnique({
      where: { id: leaveId }
    });

    if (!leaveDay || leaveDay.doctorId !== doctorId) {
      throw new Error("Leave day not found or unauthorized");
    }

    await prisma.leaveDay.delete({
      where: { id: leaveId }
    });

    return { success: true };
  }

  async getDoctorAppointments(userId, dateString) {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId }
    });

    if (!doctorProfile) {
      throw new Error("Doctor profile not found for user");
    }

    const whereClause = {
      doctorId: doctorProfile.id
    };

    if (dateString) {
      const startOfDay = new Date(dateString);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateString);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.slotStart = {
        gte: startOfDay,
        lt: endOfDay
      };
    } else {
      // Default: fetch from today onwards
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      whereClause.slotStart = {
        gte: now
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        },
        symptomForm: true,
        preVisitSummary: true,
        postVisitSummary: true
      },
      orderBy: { slotStart: 'asc' }
    });

    return appointments;
  }
}

export default new DoctorService();
