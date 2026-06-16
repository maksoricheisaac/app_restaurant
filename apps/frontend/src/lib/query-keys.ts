/**
 * Centralized query key factory — source of truth pour TanStack Query.
 *
 * Principe :
 * - Toutes les queryKey passent par ce fichier
 * - Les mutations invalident via ces clés
 * - Zéro hardcode de strings dispersés dans les hooks
 *
 * Usage :
 *   import { queryKeys } from '@/lib/query-keys';
 *   queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
 */

export const queryKeys = {
  // ─── Commandes ────────────────────────────────────────────────────────────
  orders: {
    all: () => ['orders'] as const,
    list: (filters: Record<string, unknown> = {}) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    kitchen: () => ['orders', 'kitchen'] as const,
  },

  // ─── Réservations ─────────────────────────────────────────────────────────
  reservations: {
    all: () => ['reservations'] as const,
    list: (filters: Record<string, unknown> = {}) => ['reservations', 'list', filters] as const,
    detail: (id: string) => ['reservations', 'detail', id] as const,
  },

  // ─── Menu ─────────────────────────────────────────────────────────────────
  menu: {
    items: (filters: Record<string, unknown> = {}) => ['menu-items', filters] as const,
    item: (id: string) => ['menu-item', id] as const,
    categories: () => ['menu-categories'] as const,
    category: (id: string) => ['menu-category', id] as const,
    public: (slug: string) => ['public-menu', slug] as const,
  },

  // ─── Tables ───────────────────────────────────────────────────────────────
  tables: {
    all: () => ['tables'] as const,
    detail: (id: string) => ['table', id] as const,
  },

  // ─── Clients ──────────────────────────────────────────────────────────────
  customers: {
    all: () => ['customers'] as const,
    list: (params: Record<string, unknown> = {}) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    stats: (params: Record<string, unknown> = {}) => ['dashboard-stats', params] as const,
    latestOrders: (params: Record<string, unknown> = {}) => ['latest-orders', params] as const,
    platformStats: () => ['platform-stats'] as const,
    tenants: () => ['tenants'] as const,
  },

  // ─── Inventaire ───────────────────────────────────────────────────────────
  inventory: {
    ingredients: () => ['ingredients'] as const,
    movements: (filters: Record<string, unknown> = {}) => ['stock-movements', filters] as const,
    recipes: () => ['recipes'] as const,
    alerts: () => ['low-stock-alerts'] as const,
    dashboard: () => ['inventory-dashboard'] as const,
  },

  // ─── Messages ─────────────────────────────────────────────────────────────
  messages: {
    all: () => ['messages'] as const,
    list: (filters: Record<string, unknown> = {}) => ['messages', 'list', filters] as const,
  },

  // ─── Caisse ───────────────────────────────────────────────────────────────
  cashRegister: {
    transactions: (filters: Record<string, unknown> = {}) => ['transactions', filters] as const,
    bilan: (date: string) => ['cash-bilan', date] as const,
    unpaidOrders: () => ['unpaid-orders'] as const,
  },

  // ─── Paramètres ───────────────────────────────────────────────────────────
  settings: {
    restaurant: () => ['restaurant-settings'] as const,
    openingHours: () => ['opening-hours'] as const,
  },

  // ─── Rapports ─────────────────────────────────────────────────────────────
  reports: {
    metrics: (params: Record<string, unknown> = {}) => ['report-metrics', params] as const,
    chartData: (params: Record<string, unknown> = {}) => ['report-chart-data', params] as const,
  },

  // ─── Permissions ──────────────────────────────────────────────────────────
  permissions: {
    roles: () => ['role-permissions'] as const,
    user: (userId: string) => ['user-permissions', userId] as const,
  },

  // ─── Plans & Billing ──────────────────────────────────────────────────────
  plans: {
    usage: () => ['plan-usage'] as const,
    subscription: () => ['subscription'] as const,
  },
} as const;

/**
 * Invalidations groupées — pour les mutations qui touchent plusieurs resources.
 *
 * Usage :
 *   queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
 *   // invalide toutes les clés préfixées par ['orders']
 */
export const INVALIDATION_GROUPS = {
  /** Nouvelle commande créée — invalide toutes les vues liées */
  newOrder: [
    queryKeys.orders.all(),
    queryKeys.orders.kitchen(),
    queryKeys.dashboard.stats(),
    queryKeys.dashboard.latestOrders(),
  ],

  /** Statut commande mis à jour */
  orderStatusUpdate: (id: string) => [
    queryKeys.orders.all(),
    queryKeys.orders.kitchen(),
    queryKeys.orders.detail(id),
  ],

  /** Nouvelle réservation */
  newReservation: [
    queryKeys.reservations.all(),
    queryKeys.dashboard.stats(),
  ],

  /** Nouveau message */
  newMessage: [queryKeys.messages.all()],
} as const;
