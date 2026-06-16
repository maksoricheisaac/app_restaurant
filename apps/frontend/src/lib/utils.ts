import { type ClassValue, clsx } from "clsx"
import { format, formatDistanceToNow } from "date-fns"
import { ExternalToast } from 'sonner';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une date de façon sûre : retourne `fallback` si la valeur est absente
 * ou si new Date() produit une Invalid Date (évite RangeError dans date-fns).
 */
export function safeFormat(
  raw: string | Date | null | undefined,
  fmt: string,
  opts?: Parameters<typeof format>[2],
  fallback = '—',
): string {
  if (!raw) return fallback;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return fallback;
  return format(d, fmt, opts);
}

/**
 * Version sûre de formatDistanceToNow : retourne `fallback` si la date est invalide.
 */
export function safeFormatDistanceToNow(
  raw: string | Date | null | undefined,
  opts?: Parameters<typeof formatDistanceToNow>[1],
  fallback = '—',
): string {
  if (!raw) return fallback;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return fallback;
  return formatDistanceToNow(d, opts);
}

/**
 * Version sûre de Date.toLocaleDateString — retourne `fallback` si la date est invalide.
 */
export function safeLocaleDateString(
  raw: string | Date | null | undefined,
  locale = 'fr-FR',
  opts?: Intl.DateTimeFormatOptions,
  fallback = '—',
): string {
  if (!raw) return fallback;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(locale, opts);
}

// Fonction utilitaire pour éviter les toasts dupliqués
let lastToastMessage = '';
let lastToastTime = 0;
const TOAST_DEBOUNCE_TIME = 2000; // 2 secondes

export function showToastOnce(
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  options?: ExternalToast
) {
  const now = Date.now();
  
  // Si c'est le même message et qu'il a été affiché récemment, on l'ignore
  if (lastToastMessage === message && (now - lastToastTime) < TOAST_DEBOUNCE_TIME) {
    return;
  }
  
  // Importer toast dynamiquement pour éviter les problèmes de SSR
  import('sonner').then(({ toast }) => {
    toast[type](message, options);
  });
  
  lastToastMessage = message;
  lastToastTime = now;
}
