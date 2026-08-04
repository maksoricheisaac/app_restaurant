/**
 * seed-test.ts — Données de test pour la suite E2E Playwright.
 *
 * Installe l'établissement de test complet avec :
 * - owner, manager, waiter, chef, cashier
 * - categories + items de menu
 * - tables
 * - commandes (pending, preparing, ready, served, cancelled)
 * - réservations (pending, confirmed, cancelled)
 * - messages
 *
 * Idempotent : utilise upsert pour éviter les doublons entre runs.
 *
 * Usage : npx ts-node prisma/seed-test.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL ou TEST_DATABASE_URL requis');

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter } as any);

// ─── Credentials de test (stables entre runs) ─────────────────────────────────
const HASH_ROUNDS = 10;
const RESTAURANT_ID = 'restaurant';

// Le compte racine est INDISPENSABLE : sans lui, `SetupStateService` considère
// le logiciel comme non installé et `SetupGuard` ferme toute l'API — aucun test
// ne passerait, pour une raison qui n'aurait rien à voir avec ce qu'il teste.
const CREDENTIALS = {
  super_admin: { email: 'root@test-restaurant.com', password: 'TestPass@1', name: 'Root Admin' },
  owner:   { email: 'owner@test-restaurant.com',   password: 'TestPass@1', name: 'Alice Owner' },
  manager: { email: 'manager@test-restaurant.com', password: 'TestPass@1', name: 'Bob Manager' },
  waiter:  { email: 'waiter@test-restaurant.com',  password: 'TestPass@1', name: 'Charlie Waiter' },
  chef:    { email: 'chef@test-restaurant.com',    password: 'TestPass@1', name: 'Diana Chef' },
  cashier: { email: 'cashier@test-restaurant.com', password: 'TestPass@1', name: 'Eve Cashier' },
} as const;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS);
}

async function main() {
  console.log('[seed-test] Starting...');

  // ── 1. Établissement ────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { id: RESTAURANT_ID },
    update: { name: 'Test Restaurant', setupCompleted: true },
    create: {
      id: RESTAURANT_ID,
      name: 'Test Restaurant',
      primaryColor: '#f97316',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      setupCompleted: true,
      setupCompletedAt: new Date(),
    },
  });

  console.log(`[seed-test] Restaurant: ${restaurant.name}`);

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  const usersMap: Record<string, { id: string }> = {};

  for (const [role, creds] of Object.entries(CREDENTIALS)) {
    const user = await prisma.user.upsert({
      where: { email: creds.email },
      update: {
        password: await hash(creds.password),
        emailVerified: true,
        status: 'active',
        role,
      },
      create: {
        email: creds.email,
        password: await hash(creds.password),
        name: creds.name,
        firstName: creds.name.split(' ')[0],
        lastName: creds.name.split(' ')[1] ?? '',
        emailVerified: true,
        status: 'active',
        role,
      },
    });

    usersMap[role] = { id: user.id };
    console.log(`[seed-test] User ${role}: ${creds.email}`);
  }

  const users = usersMap as Record<keyof typeof CREDENTIALS, { id: string }>;

  // ── 3. Menu Categories ───────────────────────────────────────────────────────
  const catEntrées = await prisma.menuCategory.upsert({
    where: { id: `cat-entrees` },
    update: { name: 'Entrées' },
    create: { id: `cat-entrees`, name: 'Entrées' },
  });

  const catPlats = await prisma.menuCategory.upsert({
    where: { id: `cat-plats` },
    update: { name: 'Plats' },
    create: { id: `cat-plats`, name: 'Plats' },
  });

  const catDesserts = await prisma.menuCategory.upsert({
    where: { id: `cat-desserts` },
    update: { name: 'Desserts' },
    create: { id: `cat-desserts`, name: 'Desserts' },
  });

  const catBoissons = await prisma.menuCategory.upsert({
    where: { id: `cat-boissons` },
    update: { name: 'Boissons' },
    create: { id: `cat-boissons`, name: 'Boissons' },
  });

  // ── 4. Menu Items ────────────────────────────────────────────────────────────
  const menuItemsData = [
    { id: `item-salade`, name: 'Salade César', price: 8.50, categoryId: catEntrées.id, available: true },
    { id: `item-soupe`, name: 'Soupe du jour', price: 6.00, categoryId: catEntrées.id, available: true },
    { id: `item-boeuf`, name: 'Bœuf Bourguignon', price: 18.00, categoryId: catPlats.id, available: true },
    { id: `item-poulet`, name: 'Poulet Rôti', price: 15.50, categoryId: catPlats.id, available: true },
    { id: `item-vege`, name: 'Risotto Végétarien', price: 14.00, categoryId: catPlats.id, available: true },
    { id: `item-indispo`, name: 'Plat du marché', price: 16.00, categoryId: catPlats.id, available: false },
    { id: `item-fondant`, name: 'Fondant Chocolat', price: 7.00, categoryId: catDesserts.id, available: true },
    { id: `item-tiramisu`, name: 'Tiramisu', price: 6.50, categoryId: catDesserts.id, available: true },
    { id: `item-eau`, name: 'Eau minérale', price: 2.50, categoryId: catBoissons.id, available: true },
    { id: `item-vin`, name: 'Vin rouge (25cl)', price: 5.00, categoryId: catBoissons.id, available: true },
  ];

  for (const item of menuItemsData) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: { name: item.name, price: item.price, available: item.available },
      create: { ...item },
    });
  }

  console.log(`[seed-test] Menu: ${menuItemsData.length} items`);

  // ── 5. Tables ────────────────────────────────────────────────────────────────
  const tables: { id: string; number: number; seats: number }[] = [];
  for (let i = 1; i <= 8; i++) {
    const table = await prisma.table.upsert({
      where: { id: `table-${i}` },
      update: { status: 'available' },
      create: {
        id: `table-${i}`,
        number: i,
        seats: i <= 4 ? 2 : i <= 6 ? 4 : 6,
        location: i <= 4 ? 'Salle principale' : 'Terrasse',
        status: 'available',
      },
    });
    tables.push(table as typeof table & { id: string; number: number; seats: number });
  }

  console.log(`[seed-test] Tables: ${tables.length}`);

  // ── 6. Commandes ─────────────────────────────────────────────────────────────
  const boeufItem = menuItemsData.find(i => i.name === 'Bœuf Bourguignon')!;
  const pouletItem = menuItemsData.find(i => i.name === 'Poulet Rôti')!;
  const saladItem = menuItemsData.find(i => i.name === 'Salade César')!;
  const fondantItem = menuItemsData.find(i => i.name === 'Fondant Chocolat')!;
  const eauItem = menuItemsData.find(i => i.name === 'Eau minérale')!;

  const ordersToSeed = [
    {
      id: `order-pending`,
      status: 'pending' as const,
      tableId: tables[0].id,
      total: boeufItem.price + eauItem.price,
      items: [
        { menuItemId: boeufItem.id, name: boeufItem.name, quantity: 1, price: boeufItem.price },
        { menuItemId: eauItem.id, name: eauItem.name, quantity: 1, price: eauItem.price },
      ],
    },
    {
      id: `order-preparing`,
      status: 'preparing' as const,
      tableId: tables[1].id,
      total: pouletItem.price * 2,
      items: [
        { menuItemId: pouletItem.id, name: pouletItem.name, quantity: 2, price: pouletItem.price },
      ],
    },
    {
      id: `order-ready`,
      status: 'ready' as const,
      tableId: tables[2].id,
      total: saladItem.price + fondantItem.price,
      items: [
        { menuItemId: saladItem.id, name: saladItem.name, quantity: 1, price: saladItem.price },
        { menuItemId: fondantItem.id, name: fondantItem.name, quantity: 1, price: fondantItem.price },
      ],
    },
    {
      id: `order-served`,
      status: 'served' as const,
      tableId: tables[3].id,
      total: boeufItem.price + pouletItem.price,
      items: [
        { menuItemId: boeufItem.id, name: boeufItem.name, quantity: 1, price: boeufItem.price },
        { menuItemId: pouletItem.id, name: pouletItem.name, quantity: 1, price: pouletItem.price },
      ],
    },
    {
      id: `order-cancelled`,
      status: 'cancelled' as const,
      tableId: tables[4].id,
      total: saladItem.price,
      items: [
        { menuItemId: saladItem.id, name: saladItem.name, quantity: 1, price: saladItem.price },
      ],
    },
  ];

  // Jour de service et numéros de ticket : un ticket sans numéro n'existe
  // plus depuis la reprise du cycle de vie par ligne.
  const serviceDate = new Date(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
  );
  let ticketNumber = 0;

  for (const order of ordersToSeed) {
    const { items, ...orderData } = order;
    const existing = await prisma.order.findUnique({
      where: { id: order.id },
      select: { id: true },
    });

    if (!existing) {
      ticketNumber += 1;
      // Le statut de chaque ligne reflète celui du ticket : l'avancement est
      // désormais porté par les lignes, le ticket ne fait que l'agréger.
      const lineStatus =
        order.status === 'cancelled'
          ? ('cancelled' as const)
          : order.status === 'pending'
            ? ('sent' as const)
            : (order.status as 'preparing' | 'ready' | 'served');

      await prisma.order.create({
        data: {
          ...orderData,
          number: ticketNumber,
          serviceDate,
          type: 'dine_in',
          userId: users.waiter.id,
          orderItems: {
            create: items.map((item) => ({
              ...item,
              status: lineStatus,
              sentAt: new Date(),
            })),
          },
        },
      });
    }
  }

  await prisma.ticketCounter.upsert({
    where: { serviceDate },
    create: { serviceDate, lastNumber: ticketNumber },
    update: { lastNumber: ticketNumber },
  });

  console.log(`[seed-test] Orders: ${ordersToSeed.length}`);

  // ── 7. Réservations ──────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const reservationsToSeed = [
    {
      id: `res-pending`,
      status: 'pending' as const,
      date: tomorrow,
      time: '19:00',
      guests: 2,
      customerName: 'Jean Dupont',
      email: 'jean.dupont@test.com',
      tableId: tables[5].id,
    },
    {
      id: `res-confirmed`,
      status: 'confirmed' as const,
      date: tomorrow,
      time: '20:00',
      guests: 4,
      customerName: 'Marie Martin',
      email: 'marie.martin@test.com',
      tableId: tables[6].id,
    },
    {
      id: `res-cancelled`,
      status: 'cancelled' as const,
      date: nextWeek,
      time: '19:30',
      guests: 3,
      customerName: 'Pierre Bernard',
      email: 'pierre.bernard@test.com',
    },
  ];

  for (const res of reservationsToSeed) {
    const existing = await prisma.reservation.findUnique({
      where: { id: res.id },
      select: { id: true },
    });
    if (!existing) {
      await prisma.reservation.create({
        data: { ...res },
      });
    }
  }

  console.log(`[seed-test] Reservations: ${reservationsToSeed.length}`);

  // ── 8. Messages ──────────────────────────────────────────────────────────────
  const msgExisting = await prisma.message.findUnique({
    where: { id: `msg-unread` },
    select: { id: true },
  });
  if (!msgExisting) {
    await prisma.message.create({
      data: {
        id: `msg-unread`,
        customerName: 'Client Test',
        email: 'client@test.com',
        subject: 'Question sur vos horaires',
        message: 'Êtes-vous ouverts le dimanche soir ?',
        status: 'new',
        read: false,
      },
    });
  }

  console.log('[seed-test] Done!');
  console.log(`\n[seed-test] Credentials:`);
  for (const [role, creds] of Object.entries(CREDENTIALS)) {
    console.log(`  ${role.padEnd(8)}: ${creds.email} / ${creds.password}`);
  }
}

main()
  .catch((e) => {
    console.error('[seed-test] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
