import { notFound } from "next/navigation";
import { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
  }[];
}

interface PublicMenuData {
  tenant: { id: string; name: string; slug: string; logo: string | null };
  menu: MenuCategory[];
}

async function fetchPublicMenu(slug: string): Promise<PublicMenuData | null> {
  const apiBase =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000/api/v1";
  try {
    const res = await fetch(`${apiBase}/public-menu/${slug}`, {
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
  if (!data) return { title: "Menu introuvable" };
  return {
    title: `Menu — ${data.tenant.name}`,
    description: `Consultez le menu de ${data.tenant.name} sur Flash Menu.`,
  };
}

async function resolveTableNumber(tableId: string): Promise<number | null> {
  const apiBase =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api/v1';
  try {
    const res = await fetch(`${apiBase}/public-menu/by-table/${tableId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tableNumber ?? null;
  } catch {
    return null;
  }
}

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

  const { tenant, menu } = data;

  // Resolve table number for display (optional — non-blocking)
  let tableNumber: number | null = null;
  if (tableId) {
    try {
      const apiBase =
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3000/api/v1';
      const res = await fetch(`${apiBase}/public-menu/by-table/${tableId}`, { cache: 'no-store' });
      if (res.ok) {
        const tbl = await res.json();
        tableNumber = tbl.tableNumber ?? null;
      }
    } catch { /* non-blocking */ }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Restaurant header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-xs text-slate-500">
              {tableNumber ? `Table ${tableNumber} · Menu en ligne` : 'Menu en ligne'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`/menu/${slug}/order`}
              className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-full transition-colors"
            >
              Commander
            </a>
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {menu.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700">
              Menu en cours de préparation
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Revenez bientôt pour découvrir nos plats.
            </p>
          </div>
        ) : (
          menu.map((category) => (
            <section key={category.id}>
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                {category.name}
              </h2>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="h-8 w-8 text-orange-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {item.name}
                        </h3>
                        <span className="font-bold text-orange-600 flex-shrink-0">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white">
        Propulsé par{" "}
        <span className="font-semibold text-orange-500">Flash Menu</span>
      </footer>
    </div>
  );
}
