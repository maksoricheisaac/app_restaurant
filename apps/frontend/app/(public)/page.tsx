import { SaasHero } from '@/components/customs/public/saas/hero';
import { SaasSocialProof } from '@/components/customs/public/saas/social-proof';
import { SaasFeatures } from '@/components/customs/public/saas/features';
import { SaasWorkflow } from '@/components/customs/public/saas/workflow';
import { SaasStats } from '@/components/customs/public/saas/stats';
import { SaasPricing } from '@/components/customs/public/saas/pricing';
import { SaasCTA } from '@/components/customs/public/saas/cta';
import { Testimonials } from '@/components/customs/public/home/testimonials';
import { StructuredData } from '@/components/seo/structured-data';

// Récit de la landing : accroche → preuve → capacités → fonctionnement →
// résultats → voix clients → prix → appel final. Chaque section raconte une
// étape de la décision, plutôt qu'un simple empilement.
export default function Home() {
  return (
    <>
      <StructuredData type="organization" />
      <SaasHero />
      <SaasSocialProof />
      <SaasFeatures />
      <SaasWorkflow />
      <SaasStats />
      <Testimonials />
      <SaasPricing />
      <SaasCTA />
    </>
  );
}
