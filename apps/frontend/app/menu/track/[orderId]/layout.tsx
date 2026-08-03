import { Metadata } from "next";
import { ReactNode } from "react";

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/api/v1";

async function fetchRestaurantName(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/public-menu`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.restaurant?.name as string) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  const [{ orderId }, name] = await Promise.all([
    params,
    fetchRestaurantName(),
  ]);
  const ref = orderId.slice(-8).toUpperCase();
  const title = name ? `Commande #${ref} | ${name}` : `Suivre ma commande`;
  const description = name
    ? `Suivez l'avancement de votre commande #${ref} chez ${name} en temps réel.`
    : `Suivez votre commande en temps réel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    // Les pages de suivi d'une commande précise ne doivent pas être indexées
    robots: { index: false, follow: false },
  };
}

export default function TrackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
