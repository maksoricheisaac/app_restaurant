/** Types partagés du parcours public (menu → commande → suivi). */

export interface MenuOption {
  id: string;
  name: string;
  priceDelta: number | string;
}

export interface MenuOptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number; // 0 = illimité
  options: MenuOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  image: string | null;
  optionGroups?: MenuOptionGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  items: MenuItem[];
}

/**
 * Profil public de l'établissement, tel que renvoyé par `GET /public-menu`.
 * Identité et coordonnées ne font plus qu'un objet : la séparation
 * identité/paramètres n'avait de sens qu'en multi-établissement.
 */
export interface PublicRestaurant {
  name: string;
  slogan: string | null;
  description: string | null;
  cuisineType: string | null;
  logo: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
}

export interface ServiceFlags {
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  price: number | string;
  minOrder: number | string | null;
  deliveryTime: number | null;
}

export interface PublicMenuData {
  restaurant: PublicRestaurant;
  menu: MenuCategory[];
  services?: ServiceFlags;
  deliveryZones?: DeliveryZone[];
  limits?: { maxReservationGuests: number; maxDaysInAdvance: number };
  sessionToken?: string;
}

/** Une ligne de panier : un plat + options choisies (snapshot local). */
export interface CartLine {
  /** Clé unique de ligne (item + combinaison d'options). */
  lineId: string;
  itemId: string;
  name: string;
  image: string | null;
  basePrice: number;
  quantity: number;
  /** Options choisies, aplaties pour l'affichage + le pricing. */
  selectedOptions: {
    groupId: string;
    optionId: string;
    groupName: string;
    optionName: string;
    priceDelta: number;
  }[];
}

export type ServiceType = 'dine_in' | 'takeaway' | 'delivery';
