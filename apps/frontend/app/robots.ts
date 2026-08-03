import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/auth/',
          '/invite/',
          '/setup',
          '/menu/track/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
