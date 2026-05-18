import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
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

  // 3. Création de l'administrateur
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@flashmenu.com',
      password: hashedPassword,
      name: 'Administrateur',
      platformRole: 'super_admin',
      tenantId: tenant.id,
    },
  });

  console.log('--- Initialisation terminée ---');
  console.log(`Tenant créé: ${tenant.name}`);
  console.log(`Admin créé: ${admin.email} (password: admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
