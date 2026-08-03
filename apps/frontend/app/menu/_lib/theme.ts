/**
 * Design tokens « Warm Editorial » partagés par tout le parcours public.
 * Source de vérité unique pour les neutres chauds (ivoire / sable / encre stone),
 * remplace les constantes hex dupliquées dans chaque page. La couleur du
 * restaurant (primaryColor) porte l'accent — toujours garde-fou de contraste.
 */

export const WARM = {
  page: '#f7f4ee', // ivoire chaud
  card: '#ffffff',
  surface: '#f4f1ea', // sable (survols, fonds secondaires)
  surfaceAlt: '#efeae0',
  border: '#ece6db', // filet chaud
  borderStrong: '#e5dfd3',
  ink: '#2a2620', // encre stone (texte principal)
  inkSoft: '#3a352d',
  muted: '#6b6357', // texte secondaire
  faint: '#8a8175', // texte ténu
  fainter: '#b3ab9d',
  dark: '#1b1915', // charbon chaud (hero fallback / footer)
} as const;

export const DEFAULT_BRAND = '#e5590d';

/** Normalise une couleur hex courte (#abc) ou nulle vers #rrggbb. */
export function normalizeHex(color: string | null | undefined): string {
  if (!color) return DEFAULT_BRAND;
  let hex = color.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : DEFAULT_BRAND;
}

function luminance(hex: string): number {
  const h = normalizeHex(hex).slice(1);
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Couleur de texte lisible (blanc ou encre) posée SUR `color`.
 * Garantit un contraste suffisant même si le restaurant choisit une teinte
 * claire (jaune, pastel…) — évite le texte blanc illisible.
 */
export function readableOn(color: string): string {
  return luminance(color) > 0.55 ? WARM.ink : '#ffffff';
}

/** Ajoute un canal alpha (0-1) à une couleur hex → rgba(). */
export function withAlpha(color: string, alpha: number): string {
  const h = normalizeHex(color).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
