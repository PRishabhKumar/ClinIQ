import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cliniq.com' },
    update: {},
    create: {
      email: 'admin@cliniq.com',
      passwordHash,
      role: 'ADMIN',
      name: 'System Admin',
      phone: '1234567890',
    },
  });
  console.log('Admin user created:', admin.email);

  // Seed Doctor
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@cliniq.com' },
    update: {},
    create: {
      email: 'doctor@cliniq.com',
      passwordHash,
      role: 'DOCTOR',
      name: 'Dr. John Doe',
      phone: '0987654321',
    },
  });
  
  // Seed Doctor Profile
  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specializations: ['General Practice', 'Cardiology'],
      slotDurationMin: 30,
    },
  });
  console.log('Doctor user created:', doctorUser.email);
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
