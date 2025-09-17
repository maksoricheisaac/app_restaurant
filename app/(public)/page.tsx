import { Hero } from '@/components/customs/public/home/hero';
import { Stats } from '@/components/customs/public/home/stats';
import { FeaturedDishes } from '@/components/customs/public/home/featured-dishes';
import { About } from '@/components/customs/public/home/about';
import { Testimonials } from '@/components/customs/public/home/testimonials';
import { CTA } from '@/components/customs/public/home/cta';
import { StructuredData } from '@/components/seo/structured-data';

export default function Home() {
  return (
    <>
      <StructuredData type="restaurant" />
      {/* Hero Section optimisé */}
      <Hero />
      <Stats />
      <FeaturedDishes />
      <About />
      <Testimonials />
      <CTA />
    </>
  );
}