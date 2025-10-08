/* eslint-disable react/no-unescaped-entities */
import { Sparkles, Star } from "lucide-react"
import Image from "next/image"

export const Story = () => {
    return (
        <section id="story-content" className="py-16 sm:py-24 lg:py-10 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1 space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
                    <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
                    <span className="text-xs sm:text-sm font-semibold">Notre Histoire</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 sm:mb-10">
                    Une Passion <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Familiale</span>
                  </h2>
                  
                  <div className="space-y-6 text-base sm:text-lg text-gray-600">
                    <p className="font-medium text-gray-800">
                      App_Restaurant est né d'une passion profonde pour la cuisine traditionnelle congolaise 
                      et d'un désir de partager les saveurs authentiques de notre patrimoine culinaire.
                    </p>
                    <p>
                      Fondé en 2020 par une famille de passionnés de cuisine, notre restaurant s'est donné 
                      pour mission de préserver et de célébrer les traditions culinaires du Congo tout en 
                      offrant une expérience gastronomique moderne et conviviale dans un cadre chaleureux.
                    </p>
                    <p>
                      Chaque recette de notre menu a été soigneusement sélectionnée et adaptée selon les 
                      techniques ancestrales, utilisant uniquement des ingrédients frais et locaux pour 
                      garantir l'authenticité des saveurs qui font la richesse de notre cuisine.
                    </p>
                    <p className="font-medium text-gray-800">
                      Aujourd'hui, App_Restaurant est reconnu comme l'un des meilleurs restaurants africains 
                      de Brazzaville, accueillant chaque jour des familles, des amis et des visiteurs venus 
                      découvrir ou redécouvrir la richesse de notre cuisine locale dans une ambiance unique.
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
                  
                  <div className="absolute -bottom-6 sm:-bottom-8 -right-6 sm:-right-8 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 sm:p-8 rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">2020</div>
                      <div className="text-xs sm:text-sm font-medium">Année de Fondation</div>
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