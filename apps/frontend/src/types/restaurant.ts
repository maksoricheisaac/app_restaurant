export type PaymentMethod = 'cash' | 'card' | 'online';

/** Profil complet de l'unique établissement (vue administration). */
export interface Restaurant {
  id: string;

  name: string;
  slogan?: string | null;
  description?: string | null;
  cuisineType?: string | null;

  logo?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;

  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;

  country?: string | null;
  currency: string;
  timezone: string;

  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;

  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  maxOrdersPerHour: number;
  maxOrdersPerUserHour: number;
  maxReservationGuests: number;
  maxDaysInAdvance: number;

  defaultPaymentMethod: PaymentMethod;
  taxRate: number;
  taxIncluded: boolean;
  requireCashSession: boolean;
  defaultOpeningFloat: number;

  receiptPrinterName?: string | null;
  kitchenPrinterName?: string | null;
  receiptPaperWidth: number;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  autoPrintReceipt: boolean;
  autoPrintKitchenTicket: boolean;

  setupCompleted: boolean;
  setupCompletedAt?: string | null;
}

/** Sous-ensemble exposé au site vitrine et à la carte publique. */
export type PublicRestaurant = Pick<
  Restaurant,
  | 'name'
  | 'slogan'
  | 'description'
  | 'cuisineType'
  | 'logo'
  | 'bannerUrl'
  | 'primaryColor'
  | 'phone'
  | 'email'
  | 'address'
  | 'website'
  | 'currency'
  | 'timezone'
  | 'facebookUrl'
  | 'instagramUrl'
  | 'twitterUrl'
  | 'youtubeUrl'
  | 'dineInEnabled'
  | 'takeawayEnabled'
  | 'deliveryEnabled'
  | 'maxReservationGuests'
  | 'maxDaysInAdvance'
>;
