import appointmentService from './src/services/appointment.service.js';
import prisma from './src/config/database.js';

async function run() {
  try {
    let appointment = await prisma.appointment.findFirst({ where: { status: 'HELD' } });
    if (!appointment) {
      console.log('No HELD appointments found.');
      return;
    }
    
    // Extend hold so it doesn't fail
    appointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { holdExpiresAt: new Date(Date.now() + 8 * 60000) }
    });
    
    console.log(`Testing submitSymptoms for appointment ${appointment.id}`);
    const result = await appointmentService.submitSymptoms(
      appointment.id, 
      appointment.patientId, 
      {
        rawText: 'Severe headache',
        durationDays: 2,
        severity: 'Medium'
      }
    );
    console.log('Success:', result);
  } catch (error) {
    console.error('Error running service:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
