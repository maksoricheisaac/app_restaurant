/* eslint-disable react/no-unescaped-entities */
import { OptimizedImage } from "@/components/common/OptimizedImage"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
          alt="Restaurant africain Brazzaville - Saveurs d'Afrique"
          width={1920}
          height={1080}
          priority={true}
          className="w-full h-full object-cover transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Éléments décoratifs optimisés */}
      <div className="absolute top-20 left-10 w-16 sm:w-20 h-16 sm:h-20 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 right-8 sm:right-16 w-24 sm:w-32 h-24 sm:h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-10 sm:right-20 w-12 sm:w-16 h-12 sm:h-16 bg-red-500/20 rounded-full blur-lg animate-pulse delay-500"></div>
    
      <div className="relative z-10 text-center text-white w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 animate-fade-in-up">
            <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium">Authentique Cuisine Africaine depuis 2020</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 lg:mb-8 leading-tight animate-fade-in-up delay-200">
            Saveurs d'<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 animate-gradient">Afrique</span>
          </h1>
          
          <p className="text-xl sm:text-2xl lg:text-4xl mb-4 sm:mb-6 lg:mb-8 text-orange-100 font-light animate-fade-in-up delay-400">
            L'authenticité de la cuisine africaine au cœur de Brazzaville
          </p>
          
          <p className="text-base sm:text-lg mb-8 sm:mb-10 lg:mb-12 text-orange-200 max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-600 px-4">
            Restaurant spécialisé dans la cuisine locale Congo - Spécialités traditionnelles, 
            ambiance conviviale et service authentique. Découvrez les vraies saveurs du Congo 
            dans un cadre chaleureux et moderne.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up delay-800 my-4 px-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 transform hover:scale-105 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl font-semibold group w-full sm:w-auto">
              <Link href="/menu">
                <span className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                  <span>Découvrir notre menu</span>
                  <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-white/80 text-gray-900 hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg backdrop-blur-sm transition-all duration-500 transform hover:scale-105 rounded-xl sm:rounded-2xl font-semibold group w-full sm:w-auto">
              <Link href="/contact">
                <span className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                  <span>Réserver une table</span>
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-current rounded-full group-hover:animate-ping"></div>
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
          <div className="w-5 sm:w-6 h-8 sm:h-10 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-2 sm:h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
          <span className="text-white/60 text-[10px] sm:text-xs font-medium">Découvrir</span>
        </div>
      </div>
    </section>
  )
}