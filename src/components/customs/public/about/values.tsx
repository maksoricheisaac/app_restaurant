import { Card, CardContent } from "@/components/ui/card"
import { Award, Clock, Heart, Users } from "lucide-react"

const values = [
    {
      icon: Heart,
      title: 'Passion Culinaire',
      description: 'Chaque plat est préparé avec amour selon les recettes traditionnelles transmises de génération en génération.'
    },
    {
      icon: Users,
      title: 'Accueil Chaleureux',
      description: 'Notre équipe vous accueille comme en famille dans une ambiance conviviale typiquement africaine.'
    },
    {
      icon: Award,
      title: 'Qualité Authentique',
      description: 'Nous sélectionnons les meilleurs ingrédients locaux pour vous garantir des saveurs authentiques.'
    },
    {
      icon: Clock,
      title: 'Service Rapide',
      description: 'Malgré la préparation traditionnelle, nous nous engageons à vous servir dans les meilleurs délais.'
    }
  ];

export const Values = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <div className="inline-flex items-center space-x-2 bg-orange-200 text-orange-700 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
                  <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold">Nos Valeurs</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
                  Ce Qui Nous <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Guide</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                  Les valeurs fondamentales qui nous guident au quotidien pour vous offrir la meilleure expérience culinaire africaine
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
                {values.map((value, index) => (
                  <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-white transform hover:-translate-y-4 group">
                    <CardContent className="p-6 sm:p-8 lg:p-10">
                      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <value.icon className="h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 group-hover:text-orange-600 transition-colors duration-300">
                        {value.title}
                      </h3>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
    )
}