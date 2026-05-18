import { type ClassValue, clsx } from "clsx"
import { ExternalToast } from 'sonner';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
