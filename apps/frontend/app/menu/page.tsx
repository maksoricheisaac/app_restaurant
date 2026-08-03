import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import type { PublicMenuData } from './_lib/types';
import { MenuExperience } from './_components/menu-experience';

// ─── Data fetching ────────────────────────────────────────────────────────────

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

async function fetchPublicMenu(): Promise<PublicMenuData | null> {
  try {
    const res = await fetch(`${API_BASE}/public-menu`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchPublicMenu();
  if (!data) return { title: 'Menu indisponible' };
  const { restaurant } = data;
  return {
    title: `${restaurant.name} — Menu`,
    description:
      restaurant.description ??
      `Découvrez le menu de ${restaurant.name} et commandez en ligne.`,
    openGraph: {
      title: `${restaurant.name} — Menu`,
      description: restaurant.description ?? '',
      images: restaurant.bannerUrl
        ? [{ url: restaurant.bannerUrl }]
        : restaurant.logo
          ? [{ url: restaurant.logo }]
          : [],
    },
  };
}

// ─── Page (server component → SSR de l'île cliente pour le SEO) ────────────────

export default async function PublicMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>;
}) {
  const { tableId } = await searchParams;
  const data = await fetchPublicMenu();
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
      tableId={tableId ?? null}
      tableNumber={tableNumber}
    />
  );
}
