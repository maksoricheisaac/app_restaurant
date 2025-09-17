import { LazySection } from "@/components/common/LazySection"
import { OptimizedImage } from "@/components/common/OptimizedImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Utensils } from "lucide-react"
import Link from "next/link"

const featuredDishes = [
    {
      name: 'Poulet Moambé',
      description: 'Spécialité congolaise au beurre de palme et épices traditionnelles',
      image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
      price: '8,500 FCFA'
    },
    {
      name: 'Poisson Salé aux Légumes',
      description: 'Poisson fumé accompagné de légumes frais du marché local',
      image: 'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
      price: '7,000 FCFA'
    },
    {
      name: 'Kwanga et Saka-Saka',
      description: 'Cassave fermentée avec feuilles de manioc à la sauce d\'arachide',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      price: '5,500 FCFA'
    }
  ];
  

export const FeaturedDishes = () => {
    return (
        <LazySection>
            <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-white to-orange-50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
                            <Utensils className="h-4 sm:h-5 w-4 sm:w-5" />
                            <span className="text-xs sm:text-sm font-semibold">Nos Spécialités</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
                            Saveurs <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">Authentiques</span>
                            </h2>
                            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                            Découvrez nos plats traditionnels préparés avec amour selon les recettes authentiques du Congo, 
                            transmises de génération en génération
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 px-4">
                            {featuredDishes.map((dish, index) => (
                            <Card key={index} className="overflow-hidden group hover:shadow-2xl transition-all duration-700 border-0 shadow-lg sm:shadow-xl bg-white transform hover:-translate-y-4">
                                <div className="relative h-56 sm:h-64 lg:h-72 overflow-hidden">
                                <OptimizedImage
                                    src={dish.image}
                                    alt={dish.name}
                                    width={400}
                                    height={300}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                                    <span className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm">
                                    {dish.price}
                                    </span>
                                </div>
                                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                    <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm">
                                    Voir détails
                                    </Button>
                                </div>
                                </div>
                                <CardContent className="p-6 sm:p-8">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4 group-hover:text-orange-600 transition-colors duration-300">
                                    {dish.name}
                                </h3>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                                    {dish.description}
                                </p>
                                </CardContent>
                            </Card>
                            ))}
                        </div>

                        <div className="text-center mt-12 sm:mt-16">
                            <Button asChild size="lg" className="w-full sm:w-auto h-12 sm:h-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-6 sm:px-10 text-base sm:text-lg shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-xl sm:rounded-2xl font-semibold group">
                            <Link href="/menu">
                                <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                                <span>Découvrir tout notre menu</span>
                                <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </span>
                            </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </LazySection>
    )
}