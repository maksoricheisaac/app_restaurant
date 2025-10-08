/* eslint-disable react/no-unescaped-entities */
import { LazySection } from "@/components/common/LazySection"
import { OptimizedImage } from "@/components/common/OptimizedImage"
import { Award, Clock, MapPin, Star } from "lucide-react"

export const About = () => {
    return (
        <LazySection>
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-orange-50 via-orange-100 to-yellow-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-center">
                <div className="order-2 lg:order-1">
                  <div className="inline-flex items-center space-x-2 bg-orange-200 text-orange-700 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
                    <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                    <span className="text-xs sm:text-sm font-semibold">Notre Histoire</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10">
                    Une Expérience <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Authentique</span>
                  </h2>
                  
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8 text-base sm:text-lg text-gray-700 leading-relaxed">
                    <p className="text-lg sm:text-xl">
                      Depuis notre ouverture en 2020, App_Restaurant s'est imposé comme le restaurant de référence 
                      pour la cuisine africaine à Brazzaville.
                    </p>
                    <p>
                      Nous proposons une expérience culinaire unique qui célèbre les traditions et saveurs du Congo, 
                      dans un cadre moderne et chaleureux qui vous transporte au cœur de l'Afrique centrale.
                    </p>
                    <p>
                      Nos chefs passionnés utilisent uniquement des ingrédients frais et locaux pour préparer 
                      des plats authentiques selon les recettes ancestrales transmises de génération en génération.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12">
                    <div className="flex items-center space-x-3 sm:space-x-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
                      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl">
                        <MapPin className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base">Centre-ville Brazzaville</p>
                        <p className="text-gray-600 text-xs sm:text-sm">Facilement accessible</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
                      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl">
                        <Clock className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base">Ouvert 7j/7</p>
                        <p className="text-gray-600 text-xs sm:text-sm">11h00 - 23h00</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative order-1 lg:order-2">
                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl transform rotate-2 sm:rotate-3 hover:rotate-0 transition-transform duration-700">
                    <OptimizedImage
                      src="https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg"
                      alt="Restaurant africain Brazzaville - Intérieur chaleureux"
                      width={600}
                      height={400}
                      className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                  
                  <div className="absolute -bottom-6 sm:-bottom-8 -right-6 sm:-right-8 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl transform -rotate-2 sm:-rotate-3 hover:rotate-0 transition-transform duration-700">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">5+</div>
                      <div className="text-xs sm:text-sm font-medium">Années d'Excellence</div>
                    </div>
                  </div>
                  
                  <div className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 bg-yellow-400 text-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl transform rotate-6 sm:rotate-12 hover:rotate-3 sm:hover:rotate-6 transition-transform duration-700">
                    <div className="text-center">
                      <Star className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-1 sm:mb-2" />
                      <div className="text-base sm:text-lg font-bold">4.9/5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </LazySection>
    )
}