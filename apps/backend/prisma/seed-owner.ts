/**
 * seed-owner.ts
 * Crée ou met à jour le compte propriétaire sans toucher aux autres données.
 * Le rôle « owner » étant unique, tout autre compte owner est rétrogradé
 * manager pour préserver l'invariant.
 *
 * Usage : pnpm seed-owner
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!password) throw new Error('SEED_OWNER_PASSWORD manquant dans .env');

  const email = 'owner@flashmenu.com';
  const hashed = await bcrypt.hash(password, 12);

  const owner = await prisma.$transaction(async (tx) => {
    const created = await tx.user.upsert({
      where: { email },
      update: {
        password: hashed,
        emailVerified: true,
        role: 'owner',
        status: 'active',
      },
      create: {
        email,
        password: hashed,
        name: 'Propriétaire',
        firstName: 'Propriétaire',
        lastName: '',
        emailVerified: true,
        role: 'owner',
        status: 'active',
      },
    });

    // Exactement un propriétaire à la fois.
    await tx.user.updateMany({
      where: { role: 'owner', id: { not: created.id } },
      data: { role: 'manager' },
    });

    return created;
  });

  // Révoque les refresh tokens existants pour forcer une session propre
  await prisma.refreshToken.deleteMany({ where: { userId: owner.id } });

  console.log('');
  console.log('✓ Compte propriétaire créé / mis à jour');
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log(`  Rôle     : owner`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
