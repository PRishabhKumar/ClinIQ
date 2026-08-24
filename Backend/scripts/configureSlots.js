import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function configureSlots() {
  const email = 'yrpizza135@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctorProfile: true }
  });

  if (!user || !user.doctorProfile) {
    console.log(`No doctor profile found for ${email}`);
    process.exit(1);
  }

  const doctorId = user.doctorProfile.id;

  // Clear existing working hours
  await prisma.workingHour.deleteMany({
    where: { doctorId }
  });

  // Monday to Friday, 9am to 5pm
  const workingHours = [];
  for (let weekday = 1; weekday <= 5; weekday++) {
    workingHours.push({
      doctorId,
      weekday,
      startTime: '09:00',
      endTime: '17:00'
    });
  }

  await prisma.workingHour.createMany({
    data: workingHours
  });

  console.log(`Configured standard working hours (Mon-Fri 09:00-17:00) for ${email}`);
}

configureSlots().catch(console.error).finally(() => prisma.$disconnect());
