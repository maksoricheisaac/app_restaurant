/**
 * Source de vérité unique pour les plans Flash Menu.
 * Tous les composants (public, onboarding, super-admin) importent depuis ici.
 * Pour changer un prix ou une feature → modifier uniquement ce fichier.
 */

export type PlanId = 'free' | 'pro' | 'enterprise';

export interface PlanFeature {
  label: string;
  included: boolean;
  /** Valeur texte affiché à la place de ✓/✗ (ex : "10", "Illimité") */
  value?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  /** Prix affiché dans l'onboarding (chaîne formatée) */
  priceLabel: string;
  priceDetail: string;
  badge: string | null;
  description: string;
  features: PlanFeature[];
  /** Features affichées dans la grille de comparaison super-admin */
  highlights: string[];
  /** Plan non disponible à la souscription — affiche un badge "Bientôt disponible" */
  comingSoon?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    tagline: 'Pour petits établissements',
    monthlyPrice: 0,
    annualPrice: 0,
    priceLabel: 'Gratuit',
    priceDetail: 'Pour toujours',
    badge: null,
    description: 'Pour tester Flash Menu sans risque.',
    features: [
      { label: 'Commandes / mois',        included: true,  value: '10' },
      { label: 'Articles au menu',         included: true,  value: '5' },
      { label: 'Tables + QR codes',        included: true,  value: '3' },
      { label: 'Comptes staff',            included: true,  value: '2' },
      { label: 'Dashboard de base',        included: true },
      { label: 'Rapports avancés',         included: false },
      { label: 'Kitchen Display System',   included: false },
      { label: 'Notifications email',      included: false },
      { label: 'Multi-établissements',     included: false },
    ],
    highlights: [
      '10 commandes / mois',
      '5 articles menu',
      '3 tables + QR codes',
      '2 comptes staff',
      'Dashboard de base',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Restaurants 10–50 tables',
    monthlyPrice: 29,
    annualPrice: 23,
    priceLabel: '29 €',
    priceDetail: 'par mois',
    badge: 'Le plus populaire',
    description: 'Tout ce qu\'il faut pour opérer à plein régime.',
    features: [
      { label: 'Commandes / mois',        included: true,  value: 'Illimité' },
      { label: 'Articles au menu',         included: true,  value: 'Illimité' },
      { label: 'Tables + QR codes',        included: true,  value: '10' },
      { label: 'Comptes staff',            included: true,  value: '5' },
      { label: 'Dashboard complet',        included: true },
      { label: 'Rapports avancés',         included: true },
      { label: 'Kitchen Display System',   included: true },
      { label: 'Notifications email',      included: true },
      { label: 'Multi-établissements',     included: false },
    ],
    highlights: [
      'Commandes illimitées',
      'Menu illimité',
      '10 tables + QR codes',
      '5 comptes staff',
      'Kitchen Display System',
      'Rapports avancés',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Chaînes & multi-sites',
    monthlyPrice: 99,
    annualPrice: 79,
    priceLabel: '99 €',
    priceDetail: 'par mois',
    badge: null,
    comingSoon: true,
    description: 'Pour les restaurants à fort volume et multi-établissements.',
    features: [
      { label: 'Commandes / mois',        included: true,  value: 'Illimité' },
      { label: 'Articles au menu',         included: true,  value: 'Illimité' },
      { label: 'Tables + QR codes',        included: true,  value: 'Illimité' },
      { label: 'Comptes staff',            included: true,  value: 'Illimité' },
      { label: 'Dashboard complet',        included: true },
      { label: 'Rapports personnalisés',   included: true },
      { label: 'Kitchen Display System',   included: true },
      { label: 'Notifications SMS + email',included: true },
      { label: 'Multi-établissements',     included: true },
    ],
    highlights: [
      'Commandes illimitées',
      'Menu illimité',
      'Tables illimitées',
      'Staff illimité',
      'Multi-établissements',
      'API & intégrations',
      'Manager dédié + SLA 99,9 %',
    ],
  },
];

/** Lookup rapide par id */
export const PLAN_BY_ID = Object.fromEntries(
  PLANS.map((p) => [p.id, p])
) as Record<PlanId, Plan>;

/** Prix mensuel par id (utilisé pour le calcul MRR) */
export const MONTHLY_PRICE: Record<PlanId, number> = {
  free:       0,
  pro:        29,
  enterprise: 99,
};
