import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface PublicTenantSlug {
  slug: string;
  updatedAt: string;
}

async function fetchPublicTenantSlugs(): Promise<PublicTenantSlug[]> {
  try {
    const res = await fetch(`${API_URL}/tenants/public-slugs`, {
      // Le sitemap n'a pas besoin d'être seconde par seconde à jour.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    // Le sitemap ne doit jamais faire échouer le build si le backend est
    // indisponible au moment de la génération — on retombe sur les pages
    // statiques uniquement.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${APP_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${APP_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const tenants = await fetchPublicTenantSlugs();
  const tenantPages: MetadataRoute.Sitemap = tenants.map((t) => {
    // Le backend peut renvoyer une date absente/invalide : sans garde,
    // `new Date(invalid).toISOString()` lève « Invalid time value » et fait
    // échouer tout le build. On retombe sur « maintenant » en dernier recours.
    const parsed = new Date(t.updatedAt);
    const lastModified = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    return {
      url: `${APP_URL}/menu/${t.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    };
  });

  return [...staticPages, ...tenantPages];
}
