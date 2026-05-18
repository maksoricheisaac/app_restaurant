import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('--- Réinitialisation de la base de données ---');

  // 1. Supprimer toutes les données (ordre important pour les contraintes de clé étrangère)
  // On commence par les tables dépendantes
  await prisma.orderItemsOnOrders.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tenantMembership.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.exceptionalClosure.deleteMany();
  await prisma.message.deleteMany();
  await prisma.report.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('Base de données vidée.');

  // 2. Création d'un Tenant par défaut (Flash Menu)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Flash Menu Demo',
      slug: 'demo',
    },
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;
  if (!adminPassword || !managerPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_MANAGER_PASSWORD env vars are required to run reset-db.',
    );
  }

  // 3. Création de l'administrateur (email vérifié d'office pour le seed)
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@flashmenu.com',
      password: hashedPassword,
      name: 'Administrateur',
      platformRole: 'super_admin',
      emailVerified: true, // indispensable pour pouvoir se connecter
      tenantId: null,
    },
  });

  // 4. Membership admin sur le tenant demo
  await prisma.tenantMembership.create({
    data: {
      userId: admin.id,
      tenantId: tenant.id,
      role: 'admin',
    },
  });

  // 5. Utilisateur restaurant de démonstration
  const managerHash = await bcrypt.hash(managerPassword, 12);
  const manager = await prisma.user.create({
    data: {
      email: 'manager@flashmenu.com',
      password: managerHash,
      name: 'Manager Demo',
      platformRole: 'user',
      emailVerified: true,
      tenantId: tenant.id,
    },
  });

  await prisma.tenantMembership.create({
    data: {
      userId: manager.id,
      tenantId: tenant.id,
      role: 'manager',
    },
  });

  console.log('--- Initialisation terminée ---');
  console.log(`Tenant créé  : ${tenant.name} (slug: ${tenant.slug})`);
  console.log(`Super admin  : ${admin.email}   / [SEED_ADMIN_PASSWORD]`);
  console.log(`Manager demo : ${manager.email} / [SEED_MANAGER_PASSWORD]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
