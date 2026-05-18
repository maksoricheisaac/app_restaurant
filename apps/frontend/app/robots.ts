import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/login',
          '/register',
          '/api/',
          '/_next/',
          '/favicon.ico',
        ],
      },
    ],
    sitemap: 'https://restaurant-africain.com/sitemap.xml',
    host: 'https://restaurant-africain.com',
  };
} 