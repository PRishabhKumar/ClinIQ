import prisma from '../config/database.js';

export const startHoldSweeper = () => {
  console.log('Starting background hold sweeper job...');
  
  // Run every 1 minute
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find expired held appointments
      const expiredHolds = await prisma.appointment.findMany({
        where: {
          status: 'HELD',
          holdExpiresAt: { lt: now }
        },
        select: { id: true }
      });

      if (expiredHolds.length === 0) return;

      const expiredIds = expiredHolds.map(a => a.id);

      // Delete child records first to avoid FK violations
      await prisma.preVisitSummary.deleteMany({ where: { appointmentId: { in: expiredIds } } });
      await prisma.symptomForm.deleteMany({ where: { appointmentId: { in: expiredIds } } });
      
      const result = await prisma.appointment.deleteMany({
        where: { id: { in: expiredIds } }
      });
      
      if (result.count > 0) {
        console.log(`[Hold Sweeper] Deleted ${result.count} expired held appointments.`);
      }
    } catch (error) {
      console.error('[Hold Sweeper] Error deleting expired holds:', error);
    }
  }, 60000);
};
