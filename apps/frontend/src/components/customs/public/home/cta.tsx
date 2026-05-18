import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export const CTA = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
          <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 bg-yellow-400/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-32 sm:w-48 lg:w-60 h-32 sm:h-48 lg:h-60 bg-red-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">
              Réservez Votre Table
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-orange-100 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
              Vivez une expérience culinaire inoubliable dans le meilleur restaurant africain de Brazzaville. 
              Laissez-vous transporter par nos saveurs authentiques.
            </p>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto h-12 sm:h-14 lg:h-16 bg-white text-orange-600 hover:bg-gray-100 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl shadow-xl sm:shadow-2xl hover:shadow-white/25 transition-all duration-500 transform hover:scale-105 rounded-xl sm:rounded-2xl font-bold group">
              <Link href="/contact">
                <span className="flex items-center justify-center space-x-2 sm:space-x-3 lg:space-x-4">
                  <span>Nous contacter maintenant</span>
                  <ArrowRight className="h-4 sm:h-5 lg:h-6 w-4 sm:w-5 lg:w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
}