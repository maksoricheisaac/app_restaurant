import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) {
    throw new Error("Non autorisé - Authentification requise");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur est membre du staff
 */
export async function requireStaff() {
  const session = await requireAuth();
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const staffRoles = ['admin', 'owner', 'manager', 'head_chef', 'chef', 'waiter', 'cashier'];
  if (!user || !staffRoles.includes(user.role)) {
    throw new Error("Accès refusé - Vous devez être membre du personnel");
  }

  return { session, user };
}

/**
 * Vérifie si l'utilisateur a des permissions de gestion (admin/owner/manager)
 */
export async function requireManagement() {
  const session = await requireAuth();
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const managementRoles = ['admin', 'owner', 'manager'];
  if (!user || !managementRoles.includes(user.role)) {
    throw new Error("Accès refusé - Permissions de gestion requises");
  }

  return { session, user };
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error(`Accès refusé - Rôle requis: ${allowedRoles.join(', ')}`);
  }

  return { session, user };
}
