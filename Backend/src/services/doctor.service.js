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
}

export default new DoctorService();
