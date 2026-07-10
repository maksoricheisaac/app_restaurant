import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import {
  UtensilsCrossed, Phone, Mail, MapPin, Globe,
  Facebook, Instagram, Twitter, ChevronRight, Sparkles, CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { CategoryNav } from "./_components/category-nav";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestaurantSettings {
  description:  string | null;
  phone:        string | null;
  email:        string | null;
  address:      string | null;
  website:      string | null;
  facebookUrl:  string | null;
  instagramUrl: string | null;
  twitterUrl:   string | null;
  youtubeUrl:   string | null;
}

interface Tenant {
  id:           string;
  name:         string;
  slug:         string;
  logo:         string | null;
  bannerUrl:    string | null;
  primaryColor: string | null;
  cuisineType:  string | null;
  currency:     string;
  settings:     RestaurantSettings | null;
}

interface MenuItem {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  image:       string | null;
}

interface MenuCategory {
  id:       string;
  name:     string;
  imageUrl: string | null;
  items:    MenuItem[];
}

interface PublicMenuData {
  tenant: Tenant;
  menu:   MenuCategory[];
}

// ─── Data fetching ────────────────────────────────────────────────────────────

const API_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

async function fetchPublicMenu(slug: string): Promise<PublicMenuData | null> {
  try {
    const res = await fetch(`${API_BASE}/public-menu/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPublicMenu(slug);
  if (!data) return { title: "Menu introuvable" };
  const { tenant } = data;
  return {
    title:       `${tenant.name} — Menu`,
    description: tenant.settings?.description ?? `Découvrez le menu de ${tenant.name} sur Flash Menu.`,
    openGraph: {
      title:       `${tenant.name} — Menu`,
      description: tenant.settings?.description ?? "",
      images:      tenant.bannerUrl
        ? [{ url: tenant.bannerUrl }]
        : tenant.logo ? [{ url: tenant.logo }] : [],
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency = "XAF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency, minimumFractionDigits: 0,
  }).format(price);
}

function primaryOrDefault(color: string | null) {
  return color ?? "#f97316";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ tableId?: string }>;
}) {
  const [{ slug }, { tableId }] = await Promise.all([params, searchParams]);
  const data = await fetchPublicMenu(slug);
  if (!data) notFound();

  const { tenant, menu } = data;
  const color    = primaryOrDefault(tenant.primaryColor);
  const currency = tenant.currency ?? "XAF";
  const settings = tenant.settings;
  const totalItems = menu.reduce((n, c) => n + c.items.length, 0);

  let tableNumber: number | null = null;
  if (tableId) {
    try {
      const res = await fetch(`${API_BASE}/public-menu/by-table/${tableId}`, { cache: "no-store" });
      if (res.ok) { const t = await res.json(); tableNumber = t.tableNumber ?? null; }
    } catch { /* non-blocking */ }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f1] font-sans">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      {/* min-h adaptatif: réduit en landscape mobile, plein en portrait */}
      <div className="relative overflow-hidden min-h-[320px] sm:min-h-[440px] landscape:min-h-[260px] flex flex-col justify-end">

        {tenant.bannerUrl ? (
          <>
            <Image
              src={tenant.bannerUrl}
              alt={`Bannière ${tenant.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(150deg, ${color} 0%, ${color}cc 40%, #0f0e0d 100%)` }}
            />
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-[0.08] bg-white" />
            <div className="absolute top-12 -left-10 h-48 w-48 rounded-full opacity-[0.06] bg-white" />
            <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full opacity-[0.05] bg-white" />
          </>
        )}

        {/* Hero Content */}
        <div className="relative max-w-2xl mx-auto w-full px-5 pt-12 sm:pt-20 pb-8 sm:pb-10 space-y-4 sm:space-y-5">
          {/* Logo */}
          {tenant.logo ? (
            <Image
              src={tenant.logo}
              alt={tenant.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20"
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl ring-2 ring-white/20 flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: `${color}bb` }}
            >
              <UtensilsCrossed className="h-9 w-9 text-white" />
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tight drop-shadow-sm break-words">
              {tenant.name}
            </h1>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {tenant.cuisineType && (
                <span className="text-xs font-semibold bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/10">
                  {tenant.cuisineType}
                </span>
              )}
              {tableNumber && (
                <span className="text-xs font-semibold bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/10">
                  Table {tableNumber}
                </span>
              )}
              <span className="text-xs font-semibold bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/10">
                {totalItems} plat{totalItems > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Description */}
          {settings?.description && (
            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              {settings.description}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/menu/${slug}/order${tableId ? `?table=${tableId}` : ""}`}
            className="inline-flex items-center gap-2.5 font-bold text-sm px-6 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ backgroundColor: color, color: "#fff", boxShadow: `0 8px 30px ${color}60` }}
          >
            <Sparkles className="h-4 w-4" />
            Commander maintenant
            <ChevronRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/menu/${slug}/reservation`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
          >
            <CalendarCheck className="h-4 w-4" />
            Réserver une table
          </Link>
        </div>
      </div>

      {/* ── STICKY NAV ────────────────────────────────────────────────── */}
      <CategoryNav
        categories={menu.map((c) => ({ id: c.id, name: c.name }))}
        color={color}
      />

      {/* ── MENU ──────────────────────────────────────────────────────── */}
      {/* pb-32 assure que le contenu n'est pas masqué par le bouton flottant */}
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-36 space-y-14">
        {menu.length === 0 ? (
          <div className="text-center py-28 space-y-4">
            <div className="h-24 w-24 mx-auto rounded-3xl bg-white flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="h-11 w-11 text-slate-300" />
            </div>
            <p className="text-xl font-black text-slate-700">Menu en préparation</p>
            <p className="text-sm text-slate-400">Revenez bientôt pour découvrir nos plats.</p>
          </div>
        ) : (
          menu.map((category) => (
            <section key={category.id} id={`cat-${category.id}`}>

              {/* Category header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="h-1.5 w-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-xl object-cover flex-shrink-0 shadow-sm"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">{category.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {category.items.length} plat{category.items.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/60"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      {item.image ? (
                        <>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 640px"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}
                        >
                          <UtensilsCrossed className="h-14 w-14 opacity-20" style={{ color }} />
                        </div>
                      )}
                      {/* Price */}
                      <div className="absolute bottom-0 inset-x-0 px-4 pb-3">
                        {item.image ? (
                          <span className="text-white font-black text-base drop-shadow-md">
                            {formatPrice(item.price, currency)}
                          </span>
                        ) : (
                          <span
                            className="inline-block text-white font-black text-sm px-3 py-1 rounded-full shadow-lg"
                            style={{ backgroundColor: color }}
                          >
                            {formatPrice(item.price, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-3.5">
                      <h3 className="font-black text-slate-900 text-base leading-tight">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {!item.image && (
                        <p className="text-sm font-black mt-2" style={{ color }}>
                          {formatPrice(item.price, currency)}
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

      {/* ── FLOATING ORDER BUTTON ─────────────────────────────────────── */}
      {menu.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 flex justify-center px-5 pb-safe-6 pt-4 pointer-events-none">
          <Link
            href={`/menu/${slug}/order${tableId ? `?table=${tableId}` : ""}`}
            className="pointer-events-auto flex items-center gap-3 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl text-sm transition-all hover:scale-[1.03] active:scale-[0.97] touch-manipulation"
            style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}55` }}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Passer commande
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f0e0d] text-white mt-4">
        <div className="max-w-2xl mx-auto px-5 pt-12 pb-8 space-y-8">

          {/* Identity */}
          <div className="flex items-start gap-4">
            {tenant.logo ? (
              <Image src={tenant.logo} alt={tenant.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover flex-shrink-0 shadow-lg" />
            ) : (
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ backgroundColor: color }}
              >
                <UtensilsCrossed className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-black text-xl text-white">{tenant.name}</h3>
              {tenant.cuisineType && (
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {tenant.cuisineType}
                </span>
              )}
              {settings?.description && (
                <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed line-clamp-2">
                  {settings.description}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Contact */}
          {(settings?.phone || settings?.email || settings?.address || settings?.website) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Phone className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm">{settings.phone}</span>
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Mail className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm truncate">{settings.email}</span>
                </a>
              )}
              {settings?.address && (
                <div className="flex items-start gap-3 text-slate-400 sm:col-span-2">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm leading-relaxed">{settings.address}</span>
                </div>
              )}
              {settings?.website && (
                <a href={settings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Globe className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-sm truncate">{settings.website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
            </div>
          )}

          {/* Social */}
          {(settings?.facebookUrl || settings?.instagramUrl || settings?.twitterUrl) && (
            <div className="flex items-center gap-2.5">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                   className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4 text-slate-400" />
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer"
                   className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4 text-slate-400" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer"
                   className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4 text-slate-400" />
                </a>
              )}
            </div>
          )}

          {/* Branding */}
          <div className="border-t border-white/5 pt-5 flex items-center justify-between">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} {tenant.name}</p>
            <p className="text-xs text-slate-600">
              Propulsé par <span className="font-bold" style={{ color }}>Flash Menu</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
