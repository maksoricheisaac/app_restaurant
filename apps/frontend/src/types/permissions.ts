/**
 * Rôles de l'équipe. Le logiciel n'en connaît que six : il n'y a pas de rôle
 * « user » client, les clients ne se connectant pas.
 *
 * `super_admin` est le compte racine, créé par la première installation et
 * par elle seule. Il n'est ni assignable, ni modifiable, ni supprimable depuis
 * l'interface — il figure ici pour l'affichage et pour les contrôles de rôle.
 * Miroir de `StaffRole` côté backend
 * (apps/backend/src/common/constants/staff-roles.constant.ts).
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  WAITER: 'waiter',
  CHEF: 'chef',
  CASHIER: 'cashier',
} as const;

// Type dérivé des constantes
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Export des valeurs individuelles pour faciliter l'utilisation
export const { SUPER_ADMIN, OWNER, MANAGER, WAITER, CHEF, CASHIER } = USER_ROLES;

export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  
  // Commandes
  VIEW_ORDERS = 'VIEW_ORDERS',
  CREATE_ORDERS = 'CREATE_ORDERS',
  UPDATE_ORDERS = 'UPDATE_ORDERS',
  DELETE_ORDERS = 'DELETE_ORDERS',
  MANAGE_ORDER_STATUS = 'MANAGE_ORDER_STATUS',
  
  // Menu
  VIEW_MENU = 'VIEW_MENU',
  CREATE_MENU_ITEMS = 'CREATE_MENU_ITEMS',
  UPDATE_MENU_ITEMS = 'UPDATE_MENU_ITEMS',
  DELETE_MENU_ITEMS = 'DELETE_MENU_ITEMS',
  
  // Tables
  VIEW_TABLES = 'VIEW_TABLES',
  MANAGE_TABLES = 'MANAGE_TABLES',
  
  // Réservations
  VIEW_RESERVATIONS = 'VIEW_RESERVATIONS',
  CREATE_RESERVATIONS = 'CREATE_RESERVATIONS',
  UPDATE_RESERVATIONS = 'UPDATE_RESERVATIONS',
  DELETE_RESERVATIONS = 'DELETE_RESERVATIONS',
  
  // Clients
  VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
  MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
  
  // Caisse
  VIEW_CASH_REGISTER = 'VIEW_CASH_REGISTER',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_TRANSACTIONS = 'MANAGE_TRANSACTIONS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  
  // Inventaire
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_STOCK = 'MANAGE_STOCK',
  
  // Personnel
  VIEW_STAFF = 'VIEW_STAFF',
  MANAGE_STAFF = 'MANAGE_STAFF',
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
  
  // Paramètres
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  
  // Messages
  VIEW_MESSAGES = 'VIEW_MESSAGES',
  MANAGE_MESSAGES = 'MANAGE_MESSAGES'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Le compte racine a tout, et le backend refuse d'en retirer quoi que ce
  // soit — cette ligne n'est donc jamais qu'un miroir, jamais une décision.
  [SUPER_ADMIN]: Object.values(Permission),

  [OWNER]: Object.values(Permission), // Toutes les permissions
  
  [MANAGER]: [
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
    Permission.MANAGE_MESSAGES
  ],
  
  [CHEF]: [
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
    Permission.VIEW_STAFF
  ],
  
  [WAITER]: [
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
    Permission.VIEW_CUSTOMERS
  ],
  
  [CASHIER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.VIEW_MENU,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_CASH_REGISTER,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_REPORTS
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [SUPER_ADMIN]: 'Super administrateur',
  [OWNER]: 'Propriétaire',
  [MANAGER]: 'Manager',
  [CHEF]: 'Chef',
  [WAITER]: 'Serveur',
  [CASHIER]: 'Caissier',
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEW_DASHBOARD]: 'Voir le tableau de bord',
  [Permission.VIEW_ANALYTICS]: 'Voir les analyses',
  [Permission.VIEW_ORDERS]: 'Voir les commandes',
  [Permission.CREATE_ORDERS]: 'Créer des commandes',
  [Permission.UPDATE_ORDERS]: 'Modifier les commandes',
  [Permission.DELETE_ORDERS]: 'Supprimer les commandes',
  [Permission.MANAGE_ORDER_STATUS]: 'Gérer le statut des commandes',
  [Permission.VIEW_MENU]: 'Voir le menu',
  [Permission.CREATE_MENU_ITEMS]: 'Créer des éléments de menu',
  [Permission.UPDATE_MENU_ITEMS]: 'Modifier les éléments de menu',
  [Permission.DELETE_MENU_ITEMS]: 'Supprimer les éléments de menu',
  [Permission.VIEW_TABLES]: 'Voir les tables',
  [Permission.MANAGE_TABLES]: 'Gérer les tables',
  [Permission.VIEW_RESERVATIONS]: 'Voir les réservations',
  [Permission.CREATE_RESERVATIONS]: 'Créer des réservations',
  [Permission.UPDATE_RESERVATIONS]: 'Modifier les réservations',
  [Permission.DELETE_RESERVATIONS]: 'Supprimer les réservations',
  [Permission.VIEW_CUSTOMERS]: 'Voir les clients',
  [Permission.MANAGE_CUSTOMERS]: 'Gérer les clients',
  [Permission.VIEW_CASH_REGISTER]: 'Voir la caisse',
  [Permission.MANAGE_PAYMENTS]: 'Gérer les paiements',
  [Permission.MANAGE_TRANSACTIONS]: 'Gérer les transactions',
  [Permission.VIEW_REPORTS]: 'Voir les rapports',
  [Permission.VIEW_INVENTORY]: 'Voir l\'inventaire',
  [Permission.MANAGE_INVENTORY]: 'Gérer l\'inventaire',
  [Permission.MANAGE_STOCK]: 'Gérer le stock',
  [Permission.VIEW_STAFF]: 'Voir le personnel',
  [Permission.MANAGE_STAFF]: 'Gérer le personnel',
  [Permission.MANAGE_PERMISSIONS]: 'Gérer les permissions',
  [Permission.VIEW_SETTINGS]: 'Voir les paramètres',
  [Permission.MANAGE_SETTINGS]: 'Gérer les paramètres',
  [Permission.VIEW_MESSAGES]: 'Voir les messages',
  [Permission.MANAGE_MESSAGES]: 'Gérer les messages'
};

export const PERMISSION_CATEGORIES = {
  'Tableau de bord': [Permission.VIEW_DASHBOARD, Permission.VIEW_ANALYTICS],
  'Commandes': [
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.DELETE_ORDERS,
    Permission.MANAGE_ORDER_STATUS
  ],
  'Menu': [
    Permission.VIEW_MENU,
    Permission.CREATE_MENU_ITEMS,
    Permission.UPDATE_MENU_ITEMS,
    Permission.DELETE_MENU_ITEMS
  ],
  'Tables': [Permission.VIEW_TABLES, Permission.MANAGE_TABLES],
  'Réservations': [
    Permission.VIEW_RESERVATIONS,
    Permission.CREATE_RESERVATIONS,
    Permission.UPDATE_RESERVATIONS,
    Permission.DELETE_RESERVATIONS
  ],
  'Clients': [Permission.VIEW_CUSTOMERS, Permission.MANAGE_CUSTOMERS],
  'Caisse': [
    Permission.VIEW_CASH_REGISTER,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.VIEW_REPORTS
  ],
  'Inventaire': [
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_STOCK
  ],
  'Personnel': [
    Permission.VIEW_STAFF,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_PERMISSIONS
  ],
  'Paramètres': [Permission.VIEW_SETTINGS, Permission.MANAGE_SETTINGS],
  'Messages': [Permission.VIEW_MESSAGES, Permission.MANAGE_MESSAGES]
};
