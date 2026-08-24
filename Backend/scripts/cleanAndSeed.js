import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function cleanDB() {
  console.log('Cleaning database...');
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.postVisitSummary.deleteMany({});
  await prisma.preVisitSummary.deleteMany({});
  await prisma.symptomForm.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.leaveDay.deleteMany({});
  await prisma.workingHour.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleaned successfully.');
}

async function seedAdmin() {
  console.log('Seeding Admin...');
  const email = 'rishabh260405@gmail.com';
  const password = 'admin123';
  const name = 'Admin Rishabh';
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'ADMIN'
    }
  });
  console.log(`Admin user created: ${user.email}`);
}

async function seedDoctors() {
  console.log('Seeding dummy doctors...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const doctorsData = [
    {
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@cliniq.com',
      phone: '555-0101',
      specializations: ['Cardiology', 'General Medicine'],
      slotDurationMin: 30
    },
    {
      name: 'Dr. Michael Chen',
      email: 'michael.chen@cliniq.com',
      phone: '555-0102',
      specializations: ['Pediatrics'],
      slotDurationMin: 20
    },
    {
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@cliniq.com',
      phone: '555-0103',
      specializations: ['Dermatology'],
      slotDurationMin: 15
    }
  ];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        name: doc.name,
        phone: doc.phone,
        passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specializations: doc.specializations,
            slotDurationMin: doc.slotDurationMin,
            workingHours: {
              create: [
                { weekday: 1, startTime: '09:00', endTime: '17:00' },
                { weekday: 2, startTime: '09:00', endTime: '17:00' },
                { weekday: 3, startTime: '09:00', endTime: '17:00' },
                { weekday: 4, startTime: '09:00', endTime: '17:00' },
                { weekday: 5, startTime: '09:00', endTime: '14:00' }
              ]
            }
          }
        }
      }
    });
    console.log(`Created doctor: ${user.name}`);
  }
}

async function main() {
  try {
    await cleanDB();
    await seedAdmin();
    await seedDoctors();
    console.log('All dummy data seeded successfully!');
  } catch (error) {
    console.error('Error during cleanup and seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
