import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'sakethramsathish12@gmail.com';
  try {
    await prisma.user.delete({
      where: { email }
    });
    console.log(`Successfully deleted user with email: ${email}`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`User with email ${email} not found.`);
    } else {
      console.error('Error deleting user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
