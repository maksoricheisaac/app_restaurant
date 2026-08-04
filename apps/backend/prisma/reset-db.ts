/**
 * reset-db.ts — Vide la base et réinstalle un établissement de démonstration.
 *
 * Développement uniquement. En production, la mise en service passe par
 * l'assistant de première installation (`POST /setup`).
 *
 * Usage : pnpm reset-db
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const RESTAURANT_ID = 'restaurant';

async function main() {
  console.log('--- Réinitialisation de la base de données ---');

  // Suppression dans l'ordre des dépendances de clés étrangères
  await prisma.orderLine.deleteMany();
  await prisma.ticketCounter.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashRegisterSession.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.menuItemOption.deleteMany();
  await prisma.menuItemOptionGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffInvite.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.exceptionalClosure.deleteMany();
  await prisma.message.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.restaurant.deleteMany();

  console.log('Base de données vidée.');

  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;
  if (!ownerPassword || !managerPassword) {
    throw new Error(
      'SEED_OWNER_PASSWORD et SEED_MANAGER_PASSWORD sont requis pour exécuter reset-db.',
    );
  }

  // À défaut de mot de passe dédié, le compte racine reprend celui du
  // propriétaire : un script de démonstration n'a pas à imposer une variable
  // d'environnement de plus, et les deux comptes valent de toute façon accès
  // total sur une base de démo.
  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? ownerPassword;

  const restaurant = await prisma.restaurant.create({
    data: {
      id: RESTAURANT_ID,
      name: 'Restaurant Démo',
      slogan: 'Cuisine de saison, faite maison',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      setupCompleted: true,
      setupCompletedAt: new Date(),
    },
  });

  await prisma.openingHours.createMany({
    data: Object.values(DayOfWeek).map((day) => ({
      dayOfWeek: day,
      openTime: '12:00',
      closeTime: '22:00',
      isClosed: day === DayOfWeek.MONDAY,
    })),
  });

  // Compte racine. Sans lui, `SetupGuard` considère le logiciel comme non
  // installé et ferme toute l'API — la base aurait beau être remplie, rien ne
  // répondrait.
  const superAdmin = await prisma.user.create({
    data: {
      email: 'root@flashmenu.com',
      password: await bcrypt.hash(superAdminPassword, 12),
      name: 'Super administrateur',
      role: 'super_admin',
      emailVerified: true, // indispensable pour pouvoir se connecter
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'owner@flashmenu.com',
      password: await bcrypt.hash(ownerPassword, 12),
      name: 'Propriétaire',
      role: 'owner',
      emailVerified: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@flashmenu.com',
      password: await bcrypt.hash(managerPassword, 12),
      name: 'Manager Démo',
      role: 'manager',
      emailVerified: true,
    },
  });

  console.log('--- Initialisation terminée ---');
  console.log(`Restaurant   : ${restaurant.name}`);
  console.log(
    `Super admin  : ${superAdmin.email}    / [SEED_SUPER_ADMIN_PASSWORD ou SEED_OWNER_PASSWORD]`,
  );
  console.log(`Propriétaire : ${owner.email}   / [SEED_OWNER_PASSWORD]`);
  console.log(`Manager      : ${manager.email} / [SEED_MANAGER_PASSWORD]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
