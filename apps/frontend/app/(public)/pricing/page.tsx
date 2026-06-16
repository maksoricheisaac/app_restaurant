import { Metadata } from 'next';
import PricingPageClient from '@/components/customs/public/pricing/pricing-page';

export const metadata: Metadata = {
  title: 'Tarifs — Flash Menu',
  description: 'Découvrez les plans Flash Menu : Gratuit, Pro et Enterprise. Essai 14 jours gratuit, sans carte de crédit. Tarification transparente pour votre restaurant.',
};

export default function PricingPage() {
  return <PricingPageClient />;
}
