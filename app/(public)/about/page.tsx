import { Hero } from '@/components/customs/public/about/hero';
import { Story } from '@/components/customs/public/about/story';
import { Values } from '@/components/customs/public/about/values';
import { Timeline } from '@/components/customs/public/about/timeline';
import { Team } from '@/components/customs/public/about/team';
import { CTA } from '@/components/customs/public/about/cta';

import { StructuredData } from '@/components/seo/structured-data';


export default function About() {
  return (
    <>
      <StructuredData type="organization" />
      <div className="min-h-screen bg-gray-50">
        <Hero />
        <Story />
        <Values />
        <Timeline />
        <Team />
        <CTA />
      </div>
    </>
  );
}