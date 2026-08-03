import type { Metadata } from 'next';
import { VitrineHero } from '@/components/customs/public/vitrine/hero';
import { VitrineServices } from '@/components/customs/public/vitrine/services';
import { VitrineHours, type OpeningHour } from '@/components/customs/public/vitrine/hours';
import { VitrineCTA } from '@/components/customs/public/vitrine/cta';
import { Testimonials } from '@/components/customs/public/home/testimonials';
import { StructuredData } from '@/components/seo/structured-data';
import type { PublicRestaurant } from '@/types/restaurant';

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await fetchJson<PublicRestaurant>('/restaurant/public');
  if (!restaurant) return { title: 'Restaurant' };

  const description =
    restaurant.description ??
    restaurant.slogan ??
    `Découvrez la carte de ${restaurant.name}, commandez en ligne et réservez votre table.`;

  return {
    title: restaurant.name,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      images: restaurant.bannerUrl ? [{ url: restaurant.bannerUrl }] : [],
    },
  };
}

/**
 * Site vitrine de l'établissement.
 *
 * Remplace l'ancienne landing commerciale : le visiteur n'est plus un
 * prospect à convertir en abonné, c'est un client qui vient consulter la
 * carte, réserver ou commander.
 */
export default async function Home() {
  const [restaurant, hours] = await Promise.all([
    fetchJson<PublicRestaurant>('/restaurant/public'),
    fetchJson<OpeningHour[]>('/restaurant/opening-hours'),
  ]);

  return (
    <>
      <StructuredData type="organization" />
      <VitrineHero restaurant={restaurant} />
      <VitrineServices restaurant={restaurant} />
      <Testimonials />
      <VitrineHours restaurant={restaurant} hours={hours ?? []} />
      <VitrineCTA restaurant={restaurant} />
    </>
  );
}
