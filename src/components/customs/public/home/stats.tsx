import { LazySection } from "@/components/common/LazySection"
import { Award, Star, Users, Utensils } from "lucide-react";

const stats = [
    { icon: Users, value: '2000+', label: 'Clients Satisfaits' },
    { icon: Award, value: '5', label: 'Années d\'Excellence' },
    { icon: Utensils, value: '25+', label: 'Spécialités Africaines' },
    { icon: Star, value: '4.9', label: 'Note Moyenne' }
  ];

export const Stats = () => {
    return (
        <LazySection>
        <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-32 sm:w-40 h-32 sm:h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Notre Excellence en Chiffres
                </h2>
                <p className="text-lg sm:text-xl text-orange-100 max-w-3xl mx-auto px-4">
                  La confiance de nos clients fait notre fierté
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center text-white group">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl">
                      <div className="bg-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-fit mx-auto mb-4 sm:mb-6 group-hover:bg-white/30 transition-all duration-300">
                        <stat.icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto" />
                      </div>
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm lg:text-base text-orange-100 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </LazySection>
    )
}