import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const leaves = await prisma.leaveDay.findMany();
  console.log('Leaves:', leaves);
  
  const notifications = await prisma.notificationLog.findMany();
  console.log('Notifications:', notifications);

  const appointments = await prisma.appointment.findMany({
    select: { id: true, status: true, slotStart: true }
  });
  console.log('Appointments:', appointments);
}

check().finally(() => prisma.$disconnect());
