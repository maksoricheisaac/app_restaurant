/**
 * Shared order display utilities — used by dashboard, orders page, kitchen, and reports.
 * Single source of truth for labels, colors, and formatting.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  preparing: 'En préparation',
  ready:     'Prête',
  served:    'Servie',
  completed: 'Terminée',
  paid:      'Payée',
  cancelled: 'Annulée',
};

export const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in:  'Sur place',
  takeaway: 'À emporter',
  delivery: 'Livraison',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-950/40  dark:text-amber-300',
  preparing: 'bg-blue-100    text-blue-700    border-blue-200    dark:bg-blue-950/40   dark:text-blue-300',
  ready:     'bg-indigo-100  text-indigo-700  border-indigo-200  dark:bg-indigo-950/40 dark:text-indigo-300',
  served:    'bg-green-100   text-green-700   border-green-200   dark:bg-green-950/40  dark:text-green-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  paid:      'bg-green-100   text-green-700   border-green-200   dark:bg-green-950/40  dark:text-green-300',
  cancelled: 'bg-red-100     text-red-700     border-red-200     dark:bg-red-950/40    dark:text-red-300',
};

/**
 * Formate un montant dans la devise configurée pour l'établissement.
 * Falls back to EUR when the currency code is absent or invalid.
 *
 * Usage:
 *   formatCurrency(1500, 'XAF')  // "1 500 FCFA"
 *   formatCurrency(12.5, 'EUR')  // "12,50 €"
 *   formatCurrency(9.99)         // "9,99 €"  (EUR fallback)
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'XAF' || currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'XAF' || currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to plain number with EUR
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
