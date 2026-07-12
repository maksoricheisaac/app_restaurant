import type { Metadata } from 'next';
import { AboutHero } from '@/components/customs/public/about/hero';
import { AboutStory } from '@/components/customs/public/about/story';
import { AboutValues } from '@/components/customs/public/about/values';
import { AboutTimeline } from '@/components/customs/public/about/timeline';
import { AboutTeam } from '@/components/customs/public/about/team';
import { SaasStats } from '@/components/customs/public/saas/stats';
import { SaasCTA } from '@/components/customs/public/saas/cta';

export const metadata: Metadata = {
  title: 'À propos — Flash Menu',
  description:
    "L'histoire, la mission et l'équipe derrière Flash Menu : la plateforme SaaS née en salle pour redonner du temps aux restaurateurs.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutValues />
      <SaasStats />
      <AboutTimeline />
      <AboutTeam />
      <SaasCTA />
    </>
  );
}
