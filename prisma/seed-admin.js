const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@welcona.com';
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  
  if (existingAdmin) {
    console.log('Super admin already exists:', existingAdmin.email);
    return;
  }

  const hashedPassword = await bcrypt.hash('welcona2026!', 12);
  
  const superAdmin = await prisma.admin.create({
    data: {
      email,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      password: hashedPassword,
    },
  });
  
  console.log('Created super admin:', superAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
