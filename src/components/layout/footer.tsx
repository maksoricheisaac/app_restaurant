/* eslint-disable react/no-unescaped-entities */
import { MapPin, Phone, Clock, Mail, Facebook, Instagram } from 'lucide-react';
import Link from 'next/link';


export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Restaurant Info */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-orange-400">App_Restaurant</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Découvrez l'authenticité de la cuisine africaine au cœur de Brazzaville. 
                Spécialités congolaises et plats traditionnels dans une atmosphère conviviale.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-400">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <span>Accueil</span>
                  </Link>
                </li>
                <li>
                  <Link href="/menu" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <span>Notre Menu</span>
                  </Link>
                </li>
                <li>
                  <Link href="/galerie" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <span>Galerie</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <span>Contact</span>
                  </Link>
                </li>
                <li>
                  <Link href="/suivi-commande" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center space-x-2">
                    <span>Suivi de Commande</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-400">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-orange-400 mt-1 flex-shrink-0" />
                  <div className="text-gray-300 text-sm">
                    <p className="font-medium">Avenue Amouroux</p>
                    <p>Centre-ville, Brazzaville</p>
                    <p>République du Congo</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">+242 06 123 45 67</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">contact@saveursdafrique.cg</span>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-400">Horaires</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-400 mt-1 flex-shrink-0" />
                  <div className="text-gray-300 text-sm">
                    <div className="font-medium">Lundi - Dimanche</div>
                    <div>11h00 - 23h00</div>
                    <div className="text-xs text-gray-400 mt-2">Service continu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 App_Restaurant. Tous droits réservés. Restaurant africain Brazzaville - Cuisine locale Congo.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}