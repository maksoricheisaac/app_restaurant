export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'OWNER' | 'MULTI_MANAGER' | 'FRANCHISE';
  restaurantName: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  cuisineType?: string;
  plan: 'free' | 'pro' | 'enterprise';
}
