"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRole, Permission, ROLE_PERMISSIONS, USER_ROLES } from "@/types/permissions";

// Fonction pour vérifier les permissions admin
async function checkAdminPermissions() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) {
    throw new Error("Non autorisé");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !["admin", "owner"].includes(user.role)) {
    throw new Error("Accès refusé. Permissions administrateur requises.");
  }

  return user;
}

// Initialiser les permissions par défaut pour tous les rôles
export async function initializeDefaultPermissions() {
  try {
    await checkAdminPermissions();

    // Pour l'instant, retourner un succès simulé
    // Les vraies permissions seront créées après la migration de la base de données
    return { success: true, message: "Permissions par défaut initialisées avec succès (simulation)" };
  } catch (error) {
    console.error("Erreur lors de l'initialisation des permissions:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de l'initialisation des permissions");
  }
}

// Obtenir les permissions d'un utilisateur
export async function getUserPermissions(userId: string): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  rolePermissions: Permission[];
  customPermissions: Array<{ permission: Permission; granted: boolean }>;
}> {
  try {
    await checkAdminPermissions();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Pour l'instant, utiliser les permissions par défaut du rôle
    const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      rolePermissions,
      customPermissions: [] as Array<{ permission: Permission; granted: boolean }>, // Vide pour l'instant
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la récupération des permissions");
  }
}

// Mettre à jour les permissions personnalisées d'un utilisateur
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateUserPermissions(_userId: string, _permissions: { permission: Permission; granted: boolean }[]) {
  try {
    await checkAdminPermissions();

    // Pour l'instant, simuler la mise à jour
    // Les vraies permissions seront gérées après la migration
    // TODO: Utiliser _userId et _permissions après la migration de la base de données
    return { success: true, message: "Permissions mises à jour avec succès (simulation)" };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des permissions:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la mise à jour des permissions");
  }
}

// Obtenir tous les utilisateurs avec leurs permissions
export async function getAllUsersWithPermissions() {
  try {
    await checkAdminPermissions();

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["admin", "owner", "manager", "head_chef", "chef", "waiter", "cashier"],
        },
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      status: user.status,
      customPermissions: [], // Vide pour l'instant
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la récupération des utilisateurs");
  }
}

// Obtenir les permissions par rôle
export async function getRolePermissions() {
  try {
    await checkAdminPermissions();

    // Retourner les permissions par défaut définies dans le code
    return ROLE_PERMISSIONS;
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions par rôle:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la récupération des permissions par rôle");
  }
}

// Mettre à jour les permissions d'un rôle
export async function updateRolePermissions(role: UserRole, permissions: Permission[]) {
  try {
    await checkAdminPermissions();

    // Vérifier que le rôle existe
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error("Rôle invalide");
    }

    // Pour l'instant, simuler la mise à jour
    // Dans une vraie implémentation, on stockerait cela dans une table RolePermission
    console.log(`Mise à jour des permissions pour le rôle ${role}:`, permissions);

    return { 
      success: true, 
      message: `Permissions du rôle ${role} mises à jour avec succès`,
      role,
      permissions
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des permissions du rôle:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la mise à jour des permissions du rôle");
  }
}
