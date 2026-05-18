/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export const CTA = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 sm:w-40 h-32 sm:h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-48 sm:w-60 h-48 sm:h-60 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 sm:mb-8">
                Rejoignez Notre Famille
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-orange-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto">
                Venez découvrir pourquoi Saveurs d'Afrique est le restaurant africain de référence à Brazzaville. 
                Une expérience culinaire authentique vous attend dans notre famille.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-xl shadow-2xl hover:shadow-white/25 transition-all duration-500 transform hover:scale-105 rounded-2xl font-bold group">
                  <Link href="/contact">
                    <span className="flex items-center justify-center space-x-3 sm:space-x-4">
                      <span>Nous rendre visite</span>
                      <ArrowRight className="h-5 sm:h-6 w-5 sm:w-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-orange-600 hover:bg-white hover:text-orange-600 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-xl backdrop-blur-sm transition-all duration-500 transform hover:scale-105 rounded-2xl font-bold">
                  <Link href="/menu">
                    Découvrir notre menu
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
    )
}