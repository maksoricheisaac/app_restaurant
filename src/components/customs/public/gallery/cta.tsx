import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export const CTA = () => {
    return (
        <section className="py-20 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                Venez Découvrir Nos Saveurs
              </h2>
              <p className="text-xl md:text-2xl text-orange-100 mb-10 leading-relaxed">
                Rejoignez-nous pour une expérience culinaire authentique dans le meilleur restaurant africain de Brazzaville. 
                Laissez-vous séduire par nos plats traditionnels et notre ambiance chaleureuse.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 px-10 py-6 text-xl shadow-2xl hover:shadow-white/25 transition-all duration-500 transform hover:scale-105 rounded-2xl font-bold group">
                  <Link href="/contact">
                    <span className="flex items-center space-x-4">
                      <span>Réserver une table</span>
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white text-orange-600  hover:text-orange-600 px-10 py-6 text-xl backdrop-blur-sm transition-all duration-500 transform hover:scale-105 rounded-2xl font-bold">
                  <Link href="/menu">
                    Voir notre menu
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
    )
}