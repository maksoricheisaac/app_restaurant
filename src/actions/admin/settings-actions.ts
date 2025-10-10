"use server";

import { z } from "zod";
import prisma  from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { $Enums } from "@/generated/prisma";

import {
  DeliveryZoneSchema,
  ExceptionalClosureSchema,
  GeneralSettingsSchema,
  OpeningHourSchema,
  OrderLimitsSchema,
  PersonnelSchema,
  SocialLinksSchema,
  UpdatePersonnelSchema,
} from "@/schemas/admin-schemas";

// Types
export type Personnel = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  rating: number;
  status: "active" | "inactive" | "vip";
};

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

  // Vérifier si l'utilisateur est membre du staff
  const staffRoles = ['admin', 'owner', 'manager', 'head_chef', 'chef', 'waiter', 'cashier'];
  if (!user || !staffRoles.includes(user.role)) {
    throw new Error("Accès refusé. Vous devez être membre du personnel.");
  }

  return user;
}

// Fonction pour vérifier les permissions spécifiques d'admin/owner/manager
async function checkManagementPermissions() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("Non autorisé");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Seuls admin, owner et manager peuvent gérer les paramètres
  const managementRoles = ['admin', 'owner', 'manager'];
  if (!user || !managementRoles.includes(user.role)) {
    throw new Error("Accès refusé. Permissions de gestion requises.");
  }

  return user;
}

// Récupérer tous les membres du personnel
export async function getPersonnel(): Promise<Personnel[]> {
  try {
    await checkAdminPermissions();

    const personnel = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc"
      },
      where: {
        role: {
          in: ["admin", "manager", "waiter", "kitchen", "cashier"]
        },
        isDeleted: false
      }
    });

    return personnel.map(user => ({
      id: user.id,
      firstName: user.name.split(" ")[0] || "",
      lastName: user.name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      role: user.role,
      isActive: user.status === "active",
      createdAt: user.createdAt.toISOString().split('T')[0],
      totalOrders: 0, // À calculer si nécessaire
      totalSpent: 0, // À calculer si nécessaire
      lastOrder: undefined, // À calculer si nécessaire
      rating: 0, // À calculer si nécessaire
      status: user.status as "active" | "inactive" | "vip",
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération du personnel:", error);
    throw new Error("Impossible de récupérer la liste du personnel");
  }
}

// Ajouter un nouveau membre du personnel
export async function addPersonnel(data: z.infer<typeof PersonnelSchema>) {
  try {
    await checkManagementPermissions();

    // Valider les données
    const validatedData = PersonnelSchema.parse(data);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    // Créer le compte utilisateur via better-auth API serveur
    const user = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
      }
    });

    if (!user) {
      throw new Error("Erreur lors de la création de l'utilisateur");
    }

    // Mettre à jour le rôle dans la base de données
    await prisma.user.update({
      where: { email: validatedData.email },
      data: {
        role: validatedData.role,
        status: "active",
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Personnel ajouté avec succès" };
  } catch (error) {
    console.error("Erreur lors de l'ajout du personnel:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw new Error(error instanceof Error ? error.message : "Erreur lors de l'ajout du personnel");
  }
}

// Modifier un membre du personnel
export async function updatePersonnel(data: z.infer<typeof UpdatePersonnelSchema>) {
  try {
    await checkManagementPermissions();

    // Valider les données
    const validatedData = UpdatePersonnelSchema.parse(data);

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        throw new Error("Un utilisateur avec cet email existe déjà");
      }
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        role: validatedData.role,
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Personnel modifié avec succès" };
  } catch (error) {
    console.error("Erreur lors de la modification du personnel:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la modification du personnel");
  }
}

// Supprimer un membre du personnel
export async function deletePersonnel(id: string) {
  try {
    await checkManagementPermissions();

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Empêcher la suppression du dernier administrateur
    if (existingUser.role === "admin") {
      const adminCount = await prisma.user.count({
        where: { role: "admin" }
      });

      if (adminCount <= 1) {
        throw new Error("Impossible de supprimer le dernier administrateur");
      }
    }

    // Supprimer l'utilisateur
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Personnel supprimé avec succès" };
  } catch (error) {
    console.error("Erreur lors de la suppression du personnel:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors de la suppression du personnel");
  }
}

// Activer/Désactiver un membre du personnel
export async function togglePersonnelStatus(id: string) {
  try {
    await checkManagementPermissions();

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    revalidatePath("/admin/settings");
    return { 
      success: true, 
      message: `Personnel ${newStatus === "active" ? "activé" : "désactivé"} avec succès` 
    };
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    throw new Error(error instanceof Error ? error.message : "Erreur lors du changement de statut");
  }
}

// Récupérer les statistiques du personnel
export async function getPersonnelStats() {
  try {
    await checkAdminPermissions();

    const stats = await prisma.user.groupBy({
      by: ['role'],
      where: {
        role: {
          in: ["admin", "manager", "waiter", "kitchen", "cashier"]
        },
        isDeleted: false
      },
      _count: {
        id: true
      }
    });

    const total = await prisma.user.count({
      where: {
        role: {
          in: ["admin", "manager", "waiter", "kitchen", "cashier"]
        },
        isDeleted: false
      }
    });

    const active = await prisma.user.count({
      where: {
        role: {
          in: ["admin", "manager", "waiter", "kitchen", "cashier"]
        },
        isDeleted: false,
        status: "active"
      }
    });

    return {
      total,
      active,
      byRole: stats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    throw new Error("Impossible de récupérer les statistiques");
  }
}

// --- Settings Management ---


// Récupérer les paramètres du restaurant
export async function getRestaurantSettings() {
try {
  // Pas de vérification de permissions - accessible à tous (public et staff)
  let settings = await prisma.restaurantSettings.findFirst();

if (!settings) {
  // Si aucun paramètre n'existe, en créer un par défaut
  settings = await prisma.restaurantSettings.create({
    data: {
      name: "Mon Restaurant",
      deliveryEnabled: true,
      takeawayEnabled: true,
      dineInEnabled: true,
    },
  });
}
return settings;
} catch (error) {
console.error("Erreur lors de la récupération des paramètres du restaurant:", error);
throw new Error("Impossible de charger les paramètres du restaurant.");
}
}

// Mettre à jour les paramètres généraux
export async function updateGeneralSettings(data: z.infer<typeof GeneralSettingsSchema>) {
  try {
    await checkManagementPermissions();

    const validatedData = GeneralSettingsSchema.parse(data);

    const settings = await prisma.restaurantSettings.findFirst();

    if (!settings) {
      throw new Error("Paramètres du restaurant non trouvés.");
    }

    await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: validatedData,
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Paramètres généraux mis à jour avec succès." };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres généraux:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: error instanceof Error ? error.message : "Erreur inconnue." };
  }
}

// --- Opening Hours Management ---

// Récupérer les horaires d'ouverture
export async function getOpeningHours() {
  try {
    // Pas de vérification - accessible à tous (public)
    const hours = await prisma.openingHours.findMany({
      orderBy: {
        // Assurer un ordre logique des jours
        dayOfWeek: 'asc' 
      }
    });

    // Si la table est vide, initialiser avec des valeurs par défaut
    if (hours.length === 0) {
      const days: $Enums.DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const defaultHours = days.map(day => ({
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '22:00',
        isClosed: day === 'sunday',
      }));
      await prisma.openingHours.createMany({ data: defaultHours });
      return await prisma.openingHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    }

    return hours;
  } catch (error) {
    console.error("Erreur lors de la récupération des horaires:", error);
    throw new Error("Impossible de charger les horaires d'ouverture.");
  }
}

// Mettre à jour les horaires d'ouverture
export async function updateOpeningHours(data: z.infer<typeof OpeningHourSchema>[]) {
  try {
    await checkManagementPermissions();

    const transactions = data.map(hour => {
      const validatedHour = OpeningHourSchema.parse(hour);
      return prisma.openingHours.update({
        where: { id: validatedHour.id },
        data: {
          openTime: validatedHour.openTime,
          closeTime: validatedHour.closeTime,
          isClosed: validatedHour.isClosed,
        },
      });
    });

    await prisma.$transaction(transactions);

    revalidatePath("/admin/settings");
    return { success: true, message: "Horaires mis à jour avec succès." };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des horaires:", error);
    return { success: false, message: "Erreur lors de la mise à jour des horaires." };
  }
}

// --- Exceptional Closures Management ---

// Récupérer les fermetures exceptionnelles
export async function getExceptionalClosures() {
  try {
    // Pas de vérification - accessible à tous (public)
    return await prisma.exceptionalClosure.findMany({
      orderBy: { date: 'asc' },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fermetures:", error);
    throw new Error("Impossible de charger les fermetures exceptionnelles.");
  }
}

// Ajouter une fermeture exceptionnelle
export async function addExceptionalClosure(data: z.infer<typeof ExceptionalClosureSchema>) {
  try {
    await checkManagementPermissions();
    const validatedData = ExceptionalClosureSchema.parse(data);
    await prisma.exceptionalClosure.create({ data: validatedData });
    revalidatePath("/admin/settings");
    return { success: true, message: "Date de fermeture ajoutée." };
  } catch (error) {
    console.error("Erreur lors de l'ajout de la fermeture:", error);
    return { success: false, message: "Erreur lors de l'ajout de la fermeture." };
  }
}

// Supprimer une fermeture exceptionnelle
export async function deleteExceptionalClosure(id: string) {
  try {
    await checkManagementPermissions();
    await prisma.exceptionalClosure.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true, message: "Date de fermeture supprimée." };
  } catch (error) {
    console.error("Erreur lors de la suppression de la fermeture:", error);
    return { success: false, message: "Erreur lors de la suppression de la fermeture." };
  }
}

// --- Delivery Zones Management ---

// Récupérer les zones de livraison
export async function getDeliveryZones() {
  try {
    // Pas de vérification - accessible à tous (public pour les commandes)
    return await prisma.deliveryZone.findMany({ orderBy: { name: 'asc' } });
  } catch (error) {
    console.error("Erreur lors de la récupération des zones de livraison:", error);
    throw new Error("Impossible de charger les zones de livraison.");
  }
}

// Ajouter ou modifier une zone de livraison
export async function upsertDeliveryZone(data: z.infer<typeof DeliveryZoneSchema>) {
  try {
    await checkManagementPermissions();
    const validatedData = DeliveryZoneSchema.parse(data);
    const { id, ...rest } = validatedData;

    if (id) {
      // Mettre à jour
      await prisma.deliveryZone.update({
        where: { id },
        data: rest,
      });
    } else {
      // Créer
      await prisma.deliveryZone.create({ data: rest });
    }

    revalidatePath("/admin/settings");
    return { success: true, message: `Zone de livraison ${id ? 'mise à jour' : 'ajoutée'} avec succès.` };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la zone de livraison:", error);
    return { success: false, message: "Erreur lors de la sauvegarde de la zone de livraison." };
  }
}

// Supprimer une zone de livraison
export async function deleteDeliveryZone(id: string) {
  try {
    await checkManagementPermissions();
    await prisma.deliveryZone.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true, message: "Zone de livraison supprimée." };
  } catch (error) {
    console.error("Erreur lors de la suppression de la zone de livraison:", error);
    return { success: false, message: "Erreur lors de la suppression de la zone de livraison." };
  }
}

// --- Order Limits Management ---

// Mettre à jour les limitations de commandes
export async function updateOrderLimits(data: z.infer<typeof OrderLimitsSchema>) {
  try {
    await checkManagementPermissions();
    const validatedData = OrderLimitsSchema.parse(data);

    const settings = await prisma.restaurantSettings.findFirst();
    if (!settings) {
      throw new Error("Paramètres du restaurant non trouvés.");
    }

    await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: validatedData,
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Limitations de commandes mises à jour." };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des limitations:", error);
    return { success: false, message: "Erreur lors de la mise à jour des limitations." };
  }
}

// --- Social Links Management ---

// Mettre à jour les liens des réseaux sociaux
export async function updateSocialLinks(data: z.infer<typeof SocialLinksSchema>) {
  try {
    await checkManagementPermissions();
    const validatedData = SocialLinksSchema.parse(data);

    const settings = await prisma.restaurantSettings.findFirst();
    if (!settings) {
      throw new Error("Paramètres du restaurant non trouvés.");
    }

    await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: validatedData,
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Liens des réseaux sociaux mis à jour." };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des liens sociaux:", error);
    return { success: false, message: "Erreur lors de la mise à jour des liens sociaux." };
  }
}