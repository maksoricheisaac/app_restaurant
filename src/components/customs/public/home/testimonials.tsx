/* eslint-disable react/no-unescaped-entities */
import { LazySection } from "@/components/common/LazySection"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
    {
      name: 'Marie Ngoyi',
      text: 'Excellente cuisine traditionnelle ! Le poulet moambé me rappelle celui de ma grand-mère.',
      rating: 5,
      location: 'Brazzaville'
    },
    {
      name: 'Pierre Makosso',
      text: 'Ambiance chaleureuse et plats authentiques. Un vrai voyage culinaire au Congo.',
      rating: 5,
      location: 'Pointe-Noire'
    },
    {
      name: 'Sylvie Mbemba',
      text: 'Service impeccable et saveurs d\'antan. Je recommande vivement ce restaurant !',
      rating: 5,
      location: 'Brazzaville'
    }
  ];
  

export const Testimonials = () => {
    return (
        <LazySection>
        <section className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
                  <Star className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold">Témoignages</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
                  Ce Que Disent Nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Clients</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  Découvrez les témoignages authentiques de nos clients fidèles
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 px-4">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="p-6 sm:p-8 lg:p-10 border-0 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-orange-50 transform hover:-translate-y-2 group">
                    <CardContent className="p-0">
                      <div className="flex mb-4 sm:mb-6 lg:mb-8">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 sm:h-5 lg:h-6 w-4 sm:w-5 lg:w-6 fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <p className="text-gray-700 mb-6 sm:mb-8 italic text-base sm:text-lg lg:text-xl leading-relaxed font-medium">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base sm:text-lg">{testimonial.name}</p>
                          <p className="text-gray-500 text-sm sm:text-base">{testimonial.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </LazySection>
    )
}