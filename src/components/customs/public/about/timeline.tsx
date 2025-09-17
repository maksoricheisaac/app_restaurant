/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

const timeline = [
    {
      year: '2020',
      title: 'Ouverture du Restaurant',
      description: 'Saveurs d\'Afrique ouvre ses portes au cœur de Brazzaville avec la mission de faire découvrir la vraie cuisine congolaise.'
    },
    {
      year: '2021',
      title: 'Reconnaissance Locale',
      description: 'Le restaurant devient rapidement une référence pour la cuisine africaine authentique à Brazzaville.'
    },
    {
      year: '2022',
      title: 'Expansion du Menu',
      description: 'Ajout de nouvelles spécialités régionales et élargissement de notre carte de boissons traditionnelles.'
    },
    {
      year: '2023',
      title: 'Équipe Agrandie',
      description: 'Recrutement de nouveaux chefs spécialisés dans différentes cuisines d\'Afrique centrale.'
    },
    {
      year: '2024',
      title: 'Modernisation',
      description: 'Rénovation complète du restaurant tout en préservant l\'ambiance traditionnelle africaine.'
    }
  ];

export const Timeline = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold">Notre Évolution</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
                  Moments <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Clés</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                  Retracez les moments clés de l'histoire de Saveurs d'Afrique, de notre ouverture à aujourd'hui
                </p>
              </div>

              <div className="relative">
                {/* Ligne verticale masquée sur mobile */}
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-orange-200 via-orange-300 to-orange-200"></div>
                
                <div className="space-y-8 md:space-y-0">
                  {timeline.map((event, index) => (
                    <div key={index} className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} md:mb-16 lg:mb-20`}>
                      <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 lg:pr-16 md:text-right' : 'md:pl-12 lg:pl-16'} mb-4 md:mb-0`}>
                        <Card className="hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white to-orange-50 transform hover:-translate-y-2">
                          <CardContent className="p-6 sm:p-8">
                            <div className="text-orange-600 font-bold text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4 bg-orange-100 rounded-full px-3 sm:px-4 py-1 sm:py-2 inline-block">
                              {event.year}
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                              {event.title}
                            </h3>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                              {event.description}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Point central */}
                      <div className="relative z-10 my-4 md:my-0">
                        <div className="w-4 sm:w-6 md:w-8 h-4 sm:h-6 md:h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full border-4 border-white shadow-xl"></div>
                      </div>
                      
                      {/* Espace réservé masqué sur mobile */}
                      <div className="hidden md:block md:w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
    )
}