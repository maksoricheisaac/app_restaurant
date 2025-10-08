import { PrismaClient } from '@/generated/prisma';
import { ROLE_PERMISSIONS, Permission } from '@/types/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initialisation des permissions...\n');

  try {
    // Supprimer les permissions existantes
    console.log('📝 Suppression des permissions existantes...');
    await prisma.rolePermission.deleteMany();
    console.log('✅ Permissions existantes supprimées\n');

    // Créer les permissions par défaut pour chaque rôle
    console.log('📝 Création des permissions par défaut...');
    const permissions: { role: string; permission: Permission }[] = [];
    
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      console.log(`   - ${role}: ${perms.length} permissions`);
      for (const permission of perms) {
        permissions.push({
          role,
          permission,
        });
      }
    }

    await prisma.rolePermission.createMany({
      data: permissions,
    });

    console.log(`\n✅ ${permissions.length} permissions créées avec succès!`);
    console.log('\n📊 Résumé:');
    
    // Afficher un résumé par rôle
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      console.log(`   ${role}: ${perms.length} permissions`);
    }

    console.log('\n🎉 Initialisation terminée avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation des permissions:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
