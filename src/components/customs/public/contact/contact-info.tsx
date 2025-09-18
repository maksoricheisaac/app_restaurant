import { MapPin, Phone, Mail, Clock, Navigation, Sparkles } from 'lucide-react';
import ContactCard from './contact-card';

export default function ContactInfo() {
  return (
    <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
      <div className="text-center lg:text-left mb-8 sm:mb-12">
        <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4">
          <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
          <span className="text-xs sm:text-sm font-semibold">Nos Coordonnées</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Comment Nous Joindre
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Plusieurs moyens de nous contacter sont à votre disposition. 
          N&#39;hésitez pas à utiliser celui qui vous convient le mieux.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <ContactCard 
          icon={MapPin}
          title="Notre Adresse"
          content="123 Avenue de la République, Brazzaville, Congo"
          actionLabel="Voir sur la carte"
          actionIcon={Navigation}
          actionHref="https://maps.google.com"
        />

        <ContactCard 
          icon={Phone}
          title="Téléphone"
          content="+242 06 123 4567"
          actionLabel="Nous appeler"
          actionIcon={Phone}
          actionHref="tel:+24206123456"
        />

        <ContactCard 
          icon={Mail}
          title="Email"
          content="contact@saveursdafrique.com"
          actionLabel="Nous écrire"
          actionIcon={Mail}
          actionHref="mailto:contact@saveursdafrique.com"
        />

        <ContactCard 
          icon={Clock}
          title="Horaires"
          content={
            <div className="space-y-2">
              <p>Lundi - Vendredi: 11h - 23h</p>
              <p>Samedi - Dimanche: 10h - 00h</p>
            </div>
          }
        />
      </div>
    </div>
  );
} 