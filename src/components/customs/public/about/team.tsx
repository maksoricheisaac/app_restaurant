/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

const teamMembers = [
  {
    initials: "CN",
    name: "Chef Nkounkou",
    role: "Chef Principal",
    description: "Spécialiste de la cuisine congolaise avec plus de 15 ans d'expérience dans la préparation des plats traditionnels. Gardien des recettes ancestrales."
  },
  {
    initials: "AM",
    name: "Antoinette Mvou",
    role: "Responsable Salle",
    description: "Garantit l'accueil chaleureux et le service impeccable qui font la réputation de Saveurs d'Afrique. Ambassadrice de notre hospitalité africaine."
  },
  {
    initials: "JB",
    name: "Jean-Baptiste Loubaki",
    role: "Directeur & Fondateur",
    description: "Fondateur et directeur, passionné par la promotion de la culture culinaire africaine à Brazzaville. Visionnaire de notre projet familial."
  }
];

export const Team = () => {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <div className="inline-flex items-center space-x-2 bg-orange-200 text-orange-700 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
                  <Users className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold">Notre Équipe</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
                  Des Professionnels <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Passionnés</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                  Rencontrez l'équipe dévouée qui fait de chaque visite chez Saveurs d'Afrique une expérience mémorable
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {teamMembers.map((member, index) => (
                  <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-white transform hover:-translate-y-4 group">
                    <CardContent className="p-6 sm:p-8 lg:p-10">
                      <div className="w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">{member.initials}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-orange-600 transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-base sm:text-lg text-orange-600 font-semibold mb-4 sm:mb-6">{member.role}</p>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        {member.description}
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