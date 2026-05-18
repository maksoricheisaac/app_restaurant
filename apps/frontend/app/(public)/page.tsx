import { SaasHero } from '@/components/customs/public/saas/hero';
import { SaasFeatures } from '@/components/customs/public/saas/features';
import { SaasPricing } from '@/components/customs/public/saas/pricing';
import { SaasCTA } from '@/components/customs/public/saas/cta';
import { Testimonials } from '@/components/customs/public/home/testimonials';
import { StructuredData } from '@/components/seo/structured-data';

export default function Home() {
  return (
    <>
      <StructuredData type="organization" />
      <SaasHero />
      <SaasFeatures />
      <Testimonials />
      <SaasPricing />
      <SaasCTA />
    </>
  );
}