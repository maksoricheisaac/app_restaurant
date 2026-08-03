import { Permission } from '@prisma/client';
import { StaffRole } from '../common/constants/staff-roles.constant';

const ALL_PERMISSIONS = Object.values(Permission);

/**
 * Matrice de permissions par défaut, appliquée à la première installation.
 *
 * Ce n'est qu'un point de départ : le propriétaire peut ensuite ajuster
 * librement les permissions de chaque rôle (`RolePermission`) et accorder ou
 * retirer une permission à une personne en particulier (`UserPermission`).
 *
 * Source de vérité unique côté serveur. Le frontend n'affiche que ce que
 * l'API lui renvoie — il ne rejoue jamais cette matrice de son côté.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  [StaffRole.OWNER]: ALL_PERMISSIONS,

  [StaffRole.MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.MANAGE_ORDER_STATUS,
    Permission.VIEW_MENU,
    Permission.CREATE_MENU_ITEMS,
    Permission.UPDATE_MENU_ITEMS,
    Permission.VIEW_TABLES,
    Permission.MANAGE_TABLES,
    Permission.VIEW_RESERVATIONS,
    Permission.CREATE_RESERVATIONS,
    Permission.UPDATE_RESERVATIONS,
    Permission.DELETE_RESERVATIONS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_CASH_REGISTER,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_STOCK,
    Permission.VIEW_STAFF,
    Permission.MANAGE_STAFF,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_MESSAGES,
    Permission.MANAGE_MESSAGES,
  ],

  // L'ancien rôle « chef de cuisine » a été fusionné dans « chef » : le
  // nouveau modèle n'en garde que cinq. Le chef conserve donc la main sur la
  // carte et le stock, qui relevaient de l'ancien head_chef.
  [StaffRole.CHEF]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.MANAGE_ORDER_STATUS,
    Permission.VIEW_MENU,
    Permission.CREATE_MENU_ITEMS,
    Permission.UPDATE_MENU_ITEMS,
    Permission.DELETE_MENU_ITEMS,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_STOCK,
    Permission.VIEW_STAFF,
  ],

  [StaffRole.WAITER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.VIEW_MENU,
    Permission.VIEW_TABLES,
    Permission.MANAGE_TABLES,
    Permission.VIEW_RESERVATIONS,
    Permission.CREATE_RESERVATIONS,
    Permission.UPDATE_RESERVATIONS,
    Permission.VIEW_CUSTOMERS,
  ],

  [StaffRole.CASHIER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.VIEW_MENU,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_CASH_REGISTER,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_REPORTS,
  ],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.OWNER]: 'Propriétaire',
  [StaffRole.MANAGER]: 'Manager',
  [StaffRole.WAITER]: 'Serveur',
  [StaffRole.CHEF]: 'Chef',
  [StaffRole.CASHIER]: 'Caissier',
};
