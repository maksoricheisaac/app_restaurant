import { Metadata } from "next";
import { ReactNode } from "react";

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/api/v1";

async function fetchTenantName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/public-menu/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.tenant?.name as string) ?? null;
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
  const name = await fetchTenantName(slug);
  if (!name) return { title: "Commander" };
  return {
    title: `Commander chez ${name}`,
    description: `Parcourez le menu de ${name} et passez votre commande en ligne.`,
    openGraph: {
      title: `Commander chez ${name}`,
      description: `Parcourez le menu de ${name} et passez votre commande en ligne.`,
    },
  };
}

export default function OrderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
