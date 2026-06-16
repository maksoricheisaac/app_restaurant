import { Metadata } from 'next';
import ContactPageClient from '@/components/customs/public/contact/contact-page';

export const metadata: Metadata = {
  title: 'Contact — Flash Menu',
  description: 'Contactez l\'équipe Flash Menu : démonstration, support, devis Enterprise ou toute question sur notre plateforme SaaS de gestion de restaurant.',
};

export default function ContactPage() {
  return <ContactPageClient />;
}
