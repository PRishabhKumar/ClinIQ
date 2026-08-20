const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // Delete related records first, then the orphaned HELD appointments
    const s = await p.$executeRawUnsafe('DELETE FROM "PreVisitSummary" WHERE "appointmentId" IN (SELECT id FROM "Appointment" WHERE status = \'HELD\')');
    console.log('Deleted PreVisitSummary rows:', s);

    const f = await p.$executeRawUnsafe('DELETE FROM "SymptomForm" WHERE "appointmentId" IN (SELECT id FROM "Appointment" WHERE status = \'HELD\')');
    console.log('Deleted SymptomForm rows:', f);

    const a = await p.$executeRawUnsafe('DELETE FROM "Appointment" WHERE status = \'HELD\'');
    console.log('Deleted HELD Appointment rows:', a);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
