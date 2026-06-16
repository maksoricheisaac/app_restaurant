"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, UtensilsCrossed,
  CheckCircle2, Loader2, ArrowLeft, X, ChevronUp,
  Sparkles, ExternalLink, Clock, ChefHat, BellRing,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  persistOrder,
  getActiveOrders,
  updateStoredStatus,
  type StoredOrder,
  type OrderStatus,
} from "@/lib/order-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  image:       string | null;
}
interface Category {
  id:       string;
  name:     string;
  imageUrl: string | null;
  items:    MenuItem[];
}
interface CartItem extends MenuItem { quantity: number }
interface Restaurant {
  name:         string;
  logo:         string | null;
  primaryColor: string | null;
  currency:     string;
  settings: {
    description: string | null;
    phone:       string | null;
    address:     string | null;
  } | null;
}

const API        = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const SOCKET_URL = API.replace(/\/api\/v1\/?$/, "");

function fmt(price: number, currency = "XAF") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 0 }).format(price);
}
function primary(color: string | null | undefined) { return color ?? "#f97316"; }

// Status label for the active-orders banner
const STATUS_LABEL: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; dot: string }> = {
  pending:   { label: "Reçue",           icon: Clock,        dot: "bg-blue-400"   },
  preparing: { label: "En préparation",  icon: ChefHat,      dot: "bg-amber-400"  },
  ready:     { label: "Prête !",         icon: BellRing,     dot: "bg-green-500"  },
  served:    { label: "Servie",          icon: CheckCircle2, dot: "bg-green-400"  },
  cancelled: { label: "Annulée",         icon: X,            dot: "bg-red-400"    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }     = use(params);
  const searchParams = useSearchParams();
  const tableId      = searchParams.get("table") ?? searchParams.get("tableId");

  const [restaurant,     setRestaurant]     = useState<Restaurant | null>(null);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [sessionToken,   setSessionToken]   = useState<string | null>(null);
  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [orderDone,      setOrderDone]      = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("");
  const [cartOpen,       setCartOpen]       = useState(false);
  const [activeOrders,   setActiveOrders]   = useState<StoredOrder[]>([]);

  const catRefs  = useRef<Record<string, HTMLElement | null>>({});
  // One socket per active orderId for live status sync in the banner
  const sockRefs = useRef<Record<string, Socket>>({});

  // ── Fetch menu + session token ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/public-menu/${slug}`);
        if (!res.ok) { toast.error("Restaurant introuvable"); return; }
        const data = await res.json();
        setRestaurant(data.tenant);
        setCategories(data.menu);
        if (data.sessionToken) setSessionToken(data.sessionToken);
        if (data.menu.length > 0) setActiveCategory(data.menu[0].id);
      } catch { toast.error("Impossible de charger le menu"); }
      finally  { setIsLoading(false); }
    }
    load();
  }, [slug]);

  // ── Load active orders from localStorage ────────────────────────────────
  useEffect(() => {
    setActiveOrders(getActiveOrders(slug));
  }, [slug, orderDone]); // refresh after new order

  // ── Subscribe to live status for each active order (banner sync) ─────────
  useEffect(() => {
    // Disconnect sockets for orders no longer in the list
    Object.keys(sockRefs.current).forEach((id) => {
      if (!activeOrders.find((o) => o.orderId === id)) {
        sockRefs.current[id].disconnect();
        delete sockRefs.current[id];
      }
    });

    activeOrders.forEach((order) => {
      if (sockRefs.current[order.orderId]) return; // already connected
      const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
      socket.on("connect", () => socket.emit("join-order", { orderId: order.orderId }));
      socket.on("status-update", ({ status }: { status: OrderStatus }) => {
        updateStoredStatus(slug, order.orderId, status);
        setActiveOrders(getActiveOrders(slug));
      });
      sockRefs.current[order.orderId] = socket;
    });

    return () => {
      Object.values(sockRefs.current).forEach((s) => s.disconnect());
      sockRefs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrders.map((o) => o.orderId).join(",")]);

  // ── Scroll spy ───────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveCategory(entry.target.id.replace("cat-", ""));
      },
      { threshold: 0.3, rootMargin: "-60px 0px -60% 0px" },
    );
    Object.values(catRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const color     = primary(restaurant?.primaryColor);
  const currency  = restaurant?.currency ?? "XAF";
  const total     = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} ajouté`, { duration: 1500 });
  }

  function setQty(id: string, qty: number) {
    setCart((prev) => qty <= 0
      ? prev.filter((c) => c.id !== id)
      : prev.map((c) => c.id === id ? { ...c, quantity: qty } : c));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function submitOrder() {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers["x-menu-session"] = sessionToken;

      const res = await fetch(`${API}/public-menu/${slug}/order`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type:    tableId ? "dine_in" : "takeaway",
          tableId: tableId || undefined,
          items:   cart.map((c) => ({ menuItemId: c.id, quantity: c.quantity })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `Erreur ${res.status}`);
      }

      const data = await res.json();

      // Persist to localStorage for the multi-order banner
      persistOrder({
        orderId:        data.orderId,
        slug,
        ref:            data.orderId.slice(-8).toUpperCase(),
        createdAt:      new Date().toISOString(),
        itemCount:      cart.reduce((s, i) => s + i.quantity, 0),
        total:          total,
        currency,
        status:         "pending",
        restaurantName: restaurant?.name ?? "",
      });

      setOrderDone(data.orderId);
      setCart([]);
      setCartOpen(false);

      // Refresh session token so the next order in the same session is valid
      fetch(`${API}/public-menu/${slug}`)
        .then((r) => r.json())
        .then((d) => { if (d.sessionToken) setSessionToken(d.sessionToken); })
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de la commande");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4f1] gap-3">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color }} />
      <p className="text-sm text-slate-400 font-medium">Chargement du menu…</p>
    </div>
  );

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (orderDone) {
    const trackingUrl = typeof window !== "undefined"
      ? `${window.location.origin}/menu/${slug}/track/${orderDone}`
      : `/menu/${slug}/track/${orderDone}`;

    return (
      <div className="min-h-screen bg-[#f5f4f1] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm mx-auto space-y-5">
          <div className="text-center space-y-3">
            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center shadow-lg mx-auto">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Commande envoyée !</h1>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {tableId
                  ? "Scannez le QR code pour suivre votre commande en temps réel."
                  : "Scannez le QR code pour suivre l'avancement de votre commande."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-50">
              {/* Responsive QR: 180px max, 65vw on small screens */}
              <div style={{ width: "min(180px, 65vw)", height: "min(180px, 65vw)" }}>
                <QRCodeSVG
                  value={trackingUrl}
                  size={180}
                  fgColor="#0f172a"
                  bgColor="transparent"
                  level="M"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium">Référence commande</p>
              <p className="text-base font-black text-slate-800 font-mono tracking-widest mt-0.5">
                #{orderDone.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <a
            href={trackingUrl}
            className="flex items-center justify-center gap-2 w-full font-bold text-sm text-white py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}45` }}
          >
            <Sparkles className="h-4 w-4" />
            Suivre ma commande
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>

          <div className="flex gap-3">
            <button
              onClick={() => setOrderDone(null)}
              className="flex-1 font-semibold text-sm text-slate-600 bg-white border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Commander autre chose
            </button>
            <a
              href={`/menu/${slug}`}
              className="flex-1 text-center font-semibold text-sm text-slate-600 bg-white border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Retour au menu
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a
            href={`/menu/${slug}`}
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </a>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {restaurant?.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <UtensilsCrossed className="h-4 w-4" style={{ color }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate leading-none">{restaurant?.name}</p>
              {tableId
                ? <p className="text-xs font-semibold mt-0.5" style={{ color }}>Table {tableId}</p>
                : <p className="text-xs text-slate-400 mt-0.5">À emporter</p>
              }
            </div>
          </div>

          {itemCount > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: color, boxShadow: `0 4px 12px ${color}45` }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{itemCount}</span>
            </button>
          )}
        </div>

        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  catRefs.current[cat.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap",
                  activeCategory === cat.id ? "text-white shadow-sm" : "bg-slate-100 text-slate-500",
                )}
                style={activeCategory === cat.id
                  ? { backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }
                  : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── ACTIVE ORDERS BANNER ────────────────────────────────────── */}
      {activeOrders.length > 0 && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Mes commandes en cours
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {activeOrders.map((order) => {
                const cfg = STATUS_LABEL[order.status];
                return (
                  <a
                    key={order.orderId}
                    href={`/menu/${slug}/track/${order.orderId}`}
                    className="flex-shrink-0 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl px-3 py-2 group"
                  >
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 leading-none">#{order.ref}</p>
                      <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{cfg.label}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 ml-1" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MENU ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-40 space-y-10">
        {categories.map((cat) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el) => { catRefs.current[cat.id] = el; }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {cat.imageUrl && (
                <img src={cat.imageUrl} alt={cat.name} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
              )}
              <h2 className="text-xl font-black text-slate-900 leading-none">{cat.name}</h2>
              <span className="text-xs text-slate-400 font-medium">{cat.items.length}</span>
            </div>

            <div className="space-y-3">
              {cat.items.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-200 border",
                      inCart ? "shadow-md" : "border-transparent hover:shadow-md",
                    )}
                    style={inCart ? { borderColor: `${color}30`, boxShadow: `0 4px 16px ${color}12` } : {}}
                  >
                    <div className="flex">
                      <div className="relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 bg-slate-100 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
                            <UtensilsCrossed className="h-8 w-8 opacity-25" style={{ color }} />
                          </div>
                        )}
                        {inCart && (
                          <div className="absolute top-2 left-2 h-6 w-6 rounded-full text-white text-xs font-black flex items-center justify-center shadow-lg" style={{ backgroundColor: color }}>
                            {inCart.quantity}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="font-black text-slate-900 text-sm leading-tight">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2.5">
                          <span className="font-black text-sm" style={{ color }}>{fmt(item.price, currency)}</span>

                          {inCart ? (
                            <div className="flex items-center gap-1">
                              {/* min 44px touch targets for accessibility */}
                              <button
                                onClick={() => setQty(item.id, inCart.quantity - 1)}
                                className="h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors hover:bg-slate-50 active:scale-95 touch-manipulation"
                                style={{ borderColor: color }}
                              >
                                {inCart.quantity === 1
                                  ? <Trash2 className="h-3.5 w-3.5" style={{ color }} />
                                  : <Minus   className="h-3.5 w-3.5" style={{ color }} />}
                              </button>
                              <span className="text-sm font-black w-6 text-center text-slate-900">{inCart.quantity}</span>
                              <button
                                onClick={() => addItem(item)}
                                className="h-10 w-10 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md touch-manipulation"
                                style={{ backgroundColor: color }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem(item)}
                              className="h-10 w-10 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md touch-manipulation"
                              style={{ backgroundColor: color }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* ── CART BOTTOM BAR ─────────────────────────────────────────── */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-safe-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between text-white font-bold px-5 py-4 rounded-2xl shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}55` }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl w-9 h-9 flex items-center justify-center text-sm font-black">{itemCount}</div>
                <span className="text-sm">Voir ma sélection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">{fmt(total, currency)}</span>
                <ChevronUp className="h-4 w-4 opacity-80" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ─────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <ShoppingCart className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-base leading-none">Ma sélection</p>
                  <p className="text-xs text-slate-400 mt-0.5">{itemCount} article{itemCount > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={() => setCartOpen(false)} className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
                          <UtensilsCrossed className="h-5 w-5 opacity-30" style={{ color }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate leading-none">{item.name}</p>
                    <p className="text-xs font-black mt-1" style={{ color }}>{fmt(item.price * item.quantity, currency)}</p>
                    {item.quantity > 1 && <p className="text-xs text-slate-400 mt-0.5">{fmt(item.price, currency)} × {item.quantity}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setQty(item.id, item.quantity - 1)}
                      className="h-10 w-10 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
                      style={{ borderColor: color }}
                    >
                      {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" style={{ color }} /> : <Minus className="h-3.5 w-3.5" style={{ color }} />}
                    </button>
                    <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      className="h-10 w-10 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 touch-manipulation"
                      style={{ backgroundColor: color }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pt-4 pb-safe-6 border-t border-slate-100 space-y-3 flex-shrink-0 bg-white rounded-b-3xl">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 text-sm font-medium">Total</span>
                <span className="text-2xl font-black text-slate-900">{fmt(total, currency)}</span>
              </div>
              {tableId && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl py-2.5" style={{ backgroundColor: `${color}12`, color }}>
                  Commande pour la table {tableId}
                </div>
              )}
              <button
                onClick={submitOrder}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl text-base shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}45` }}
              >
                {isSubmitting
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <><Sparkles className="h-5 w-5" />Confirmer la commande</>
                }
              </button>
              <button
                onClick={() => { setCart([]); setCartOpen(false); }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1.5"
              >
                Vider la sélection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
