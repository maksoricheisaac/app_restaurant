import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4000';

/**
 * Sitemap du site vitrine.
 *
 * Il n'y a plus de pages à découvrir dynamiquement : un seul établissement,
 * donc un ensemble de pages fixe. L'appel réseau qui listait les slugs des
 * restaurants — et qui pouvait faire échouer le build quand le backend était
 * indisponible — a disparu avec eux.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: APP_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${APP_URL}/menu`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/menu/reservation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${APP_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
