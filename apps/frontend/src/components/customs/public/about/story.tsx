/* eslint-disable react/no-unescaped-entities */
import { Sparkles, Star } from "lucide-react"
import Image from "next/image"

export const Story = () => {
    return (
        <section id="story-content" className="py-16 sm:py-24 lg:py-32 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1 space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
                    <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
                    <span className="text-xs sm:text-sm font-semibold">Notre Vision</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-8 sm:mb-10">
                    Digitaliser la <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Gastronomie</span>
                  </h2>

                  <div className="space-y-6 text-base sm:text-lg text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Flash Menu est né d'un constat simple : la technologie doit aider les restaurateurs à
                      se concentrer sur leur métier passion plutôt que sur les contraintes logistiques.
                    </p>
                    <p>
                      Lancée en 2023, notre plateforme SaaS a été conçue pour répondre aux défis modernes
                      de la restauration : rapidité de service, expérience client digitale et optimisation opérationnelle.
                    </p>
                    <p>
                      Nous croyons que chaque restaurant, quelle que soit sa taille, mérite des outils de
                      gestion de classe mondiale, simples à utiliser et accessibles.
                    </p>
                  </div>
                </div>

                <div className="order-1 lg:order-2 relative">
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
                    <Image
                      width={1000}
                      height={1000}
                      src="https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg"
                      alt="Histoire restaurant africain Brazzaville - Fondateurs Saveurs d'Afrique"
                      className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>

                  <div className="absolute -bottom-6 sm:-bottom-8 -right-6 sm:-right-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 sm:p-8 rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">2023</div>
                      <div className="text-xs sm:text-sm font-medium">Lancement</div>
                    </div>
                  </div>

                  <div className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 bg-yellow-400 text-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl transform rotate-12 hover:rotate-6 transition-transform duration-700">
                    <div className="text-center">
                      <Star className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-1 sm:mb-2" />
                      <div className="text-sm sm:text-lg font-bold">Excellence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    )
}
