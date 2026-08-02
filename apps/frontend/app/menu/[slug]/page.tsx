import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import type { PublicMenuData } from './_lib/types';
import { MenuExperience } from './_components/menu-experience';

// ─── Data fetching ────────────────────────────────────────────────────────────

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

async function fetchPublicMenu(slug: string): Promise<PublicMenuData | null> {
  try {
    const res = await fetch(`${API_BASE}/public-menu/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPublicMenu(slug);
  if (!data) return { title: 'Menu introuvable' };
  const { tenant } = data;
  return {
    title: `${tenant.name} — Menu`,
    description:
      tenant.settings?.description ??
      `Découvrez le menu de ${tenant.name} et commandez en ligne sur Flash Menu.`,
    openGraph: {
      title: `${tenant.name} — Menu`,
      description: tenant.settings?.description ?? '',
      images: tenant.bannerUrl
        ? [{ url: tenant.bannerUrl }]
        : tenant.logo
          ? [{ url: tenant.logo }]
          : [],
    },
  };
}

// ─── Page (server component → SSR de l'île cliente pour le SEO) ────────────────

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tableId?: string }>;
}) {
  const [{ slug }, { tableId }] = await Promise.all([params, searchParams]);
  const data = await fetchPublicMenu(slug);
  if (!data) notFound();

  // Résolution du numéro de table (affichage « Table 3 » plutôt qu'un UUID).
  let tableNumber: number | null = null;
  if (tableId) {
    try {
      const res = await fetch(`${API_BASE}/public-menu/by-table/${tableId}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const t = await res.json();
        tableNumber = t.tableNumber ?? null;
      }
    } catch {
      /* non-bloquant */
    }
  }

  return (
    <MenuExperience
      initial={data}
      slug={slug}
      tableId={tableId ?? null}
      tableNumber={tableNumber}
    />
  );
}
