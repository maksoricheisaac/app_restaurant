/* eslint-disable react/no-unescaped-entities */
import { Package } from "lucide-react"

export const Header = ()  => {
    return (
        <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-6 py-3 mb-6">
                <Package className="h-5 w-5" />
                <span className="text-sm font-semibold">Suivi de Commande</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Suivez Votre Commande
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Entrez votre numéro de commande pour suivre l'état de préparation en temps réel
            </p>
        </div>
    )
}