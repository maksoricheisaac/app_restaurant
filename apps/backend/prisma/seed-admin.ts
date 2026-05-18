/**
 * seed-admin.ts
 * Crée ou met à jour le compte super_admin sans toucher aux autres données.
 * Usage : pnpm seed-admin
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error('SEED_ADMIN_PASSWORD manquant dans .env');

  const email = 'admin@flashmenu.com';
  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      emailVerified: true,
      platformRole: 'super_admin',
      status: 'active',
    },
    create: {
      email,
      password: hashed,
      name: 'Super Administrateur',
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      platformRole: 'super_admin',
      status: 'active',
      onboardingCompleted: true,
    },
  });

  // Révoque les refresh tokens existants pour forcer une session propre
  await prisma.refreshToken.deleteMany({ where: { userId: admin.id } });

  console.log('');
  console.log('✓ Compte admin créé / mis à jour');
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log(`  Role     : super_admin`);
  console.log(`  Vérifié  : oui`);
  console.log('');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
