import { MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactHero() {
  return (
    <section className="relative min-h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden py-16 sm:py-0">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      </div>

      {/* Éléments décoratifs */}
      <div className="absolute top-20 left-10 w-16 sm:w-20 h-16 sm:h-20 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-24 sm:w-32 h-24 sm:h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium text-white">Nous Sommes Là Pour Vous</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
            Nous Contacter
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-orange-100 leading-relaxed max-w-4xl mx-auto px-4">
            Réservez votre table ou contactez-nous pour toute information. 
            Nous sommes situés au cœur de Brazzaville, facilement accessible. 
            Notre équipe est à votre disposition pour vous offrir la meilleure expérience.
          </p>

          <div className="mt-8 sm:mt-10">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 transform hover:scale-105 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-2xl font-semibold group">
              <a href="#contact-content">
                <span className="flex items-center space-x-2 sm:space-x-3">
                  <span>Nous contacter</span>
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