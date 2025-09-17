import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const genericUser = await prisma.user.upsert({
    where: { email: 'vente.comptoir@mbokatech.com' },
    update: {},
    create: {
      id: 'cl_comptoir_user',
      name: 'Vente au comptoir',
      email: 'vente.comptoir@mbokatech.com',
      emailVerified: true,
      role: 'user',
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`Created generic user "Vente au comptoir" with id: ${genericUser.id}`);

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
