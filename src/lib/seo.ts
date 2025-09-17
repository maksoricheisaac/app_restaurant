export function generateStructuredData(type: 'restaurant' | 'menu' | 'organization') {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Restaurant Mboka Tech",
    "description": "Restaurant gastronomique offrant une expérience culinaire exceptionnelle",
    "url": "https://restaurant-mboka-tech.com",
    "telephone": "+1234567890",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Rue de la Gastronomie",
      "addressLocality": "Ville",
      "postalCode": "12345",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.8566,
      "longitude": 2.3522
    },
    "openingHours": [
      "Mo-Su 11:00-23:00"
    ],
    "priceRange": "€€",
    "servesCuisine": ["Française", "Internationale"],
    "hasMenu": "https://restaurant-mboka-tech.com/menu"
  };

  switch (type) {
    case 'restaurant':
      return baseData;
    case 'menu':
      return {
        "@context": "https://schema.org",
        "@type": "Menu",
        "name": "Menu du Restaurant Mboka Tech",
        "url": "https://restaurant-mboka-tech.com/menu",
        "restaurant": {
          "@type": "Restaurant",
          "name": "Restaurant Mboka Tech"
        }
      };
    case 'organization':
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Restaurant Mboka Tech",
        "url": "https://restaurant-mboka-tech.com",
        "logo": "https://restaurant-mboka-tech.com/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1234567890",
          "contactType": "customer service"
        }
      };
    default:
      return baseData;
  }
} 