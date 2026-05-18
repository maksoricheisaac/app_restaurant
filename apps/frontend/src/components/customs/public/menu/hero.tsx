import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function MenuHero() {
  return (
    <section className="relative min-h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden py-16 sm:py-0">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg"
          alt="Menu restaurant africain"
          width={1920}
          height={1080}
          priority={true}
          className="w-full h-full object-cover transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      <div className="absolute top-20 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-32 sm:w-48 h-32 sm:h-48 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium tracking-wide text-white">Cuisine Authentique Africaine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 font-serif bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
            Notre Menu
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-orange-100 leading-relaxed max-w-4xl mx-auto font-light px-4">
            Découvrez nos spécialités africaines authentiques préparées avec passion. 
            Une cuisine traditionnelle qui vous fera voyager.
          </p>

          <div className="mt-8 sm:mt-12">
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 transform hover:scale-105 px-6 sm:px-10 py-3 sm:py-6 text-base sm:text-lg rounded-2xl font-semibold group"
            >
              <a href="#menu-content">
                <span className="flex items-center space-x-2 sm:space-x-3">
                  <span className="tracking-wide">Explorer le menu</span>
                  <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 