const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'rishabh260405@gmail.com' }
  });
  console.log(user ? `User found: ${user.name} - Role: ${user.role}` : 'User not found');
  await prisma.$disconnect();
}

main().catch(console.error);
