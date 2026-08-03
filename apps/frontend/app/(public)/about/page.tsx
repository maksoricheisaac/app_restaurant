import type { Metadata } from 'next';
import { AboutHero } from '@/components/customs/public/about/hero';
import { AboutStory } from '@/components/customs/public/about/story';
import { AboutValues } from '@/components/customs/public/about/values';
import { AboutTimeline } from '@/components/customs/public/about/timeline';
import { AboutTeam } from '@/components/customs/public/about/team';
import { VitrineCTA } from '@/components/customs/public/vitrine/cta';
import type { PublicRestaurant } from '@/types/restaurant';

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

async function fetchRestaurant(): Promise<PublicRestaurant | null> {
  try {
    const res = await fetch(`${API_BASE}/restaurant/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicRestaurant;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await fetchRestaurant();
  const name = restaurant?.name ?? 'notre maison';

  return {
    title: `À propos — ${restaurant?.name ?? 'Notre maison'}`,
    description: `L'histoire, les valeurs et l'équipe de ${name}.`,
  };
}

export default async function AboutPage() {
  const restaurant = await fetchRestaurant();

  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutValues />
      <AboutTimeline />
      <AboutTeam />
      <VitrineCTA restaurant={restaurant} />
    </>
  );
}
