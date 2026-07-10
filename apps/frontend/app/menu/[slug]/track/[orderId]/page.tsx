"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2, Clock, ChefHat, BellRing, XCircle,
  Loader2, ArrowLeft, UtensilsCrossed, RefreshCw, Receipt,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { updateStoredStatus, type OrderStatus } from "@/lib/order-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id:       string;
  name:     string;
  quantity: number;
  price:    string | number;
  image:    string | null;
}

interface TrackingData {
  id:           string;
  status:       OrderStatus;
  type:         "dine_in" | "takeaway" | "delivery";
  total:        string | number | null;
  createdAt:    string;
  updatedAt:    string;
  specialNotes: string | null;
  table:        { number: number } | null;
  tenant: {
    name:         string;
    logo:         string | null;
    primaryColor: string | null;
    currency:     string;
    slug:         string;
  };
  orderItems: OrderItem[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API        = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const SOCKET_URL = API.replace(/\/api\/v1\/?$/, "");

function fmt(price: string | number, currency = "XAF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency, minimumFractionDigits: 0,
  }).format(Number(price));
}

function primary(color: string | null | undefined) { return color ?? "#f97316"; }

// ─── Status config ────────────────────────────────────────────────────────────

const STEPS: {
  status: OrderStatus;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { status: "pending",   label: "Commande reçue",   sublabel: "Le restaurant a bien reçu votre commande", icon: Clock        },
  { status: "preparing", label: "En préparation",   sublabel: "La cuisine prépare votre commande",        icon: ChefHat      },
  { status: "ready",     label: "Prête !",           sublabel: "Votre commande est prête",                icon: BellRing     },
  { status: "served",    label: "Servie",            sublabel: "Bon appétit !",                           icon: CheckCircle2 },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0, preparing: 1, ready: 2, served: 3, cancelled: -1,
};

const STATUS_HERO: Record<OrderStatus, {
  label: string; sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string; iconColor: string;
}> = {
  pending:   { label: "Commande reçue",        sublabel: "Le restaurant a bien reçu votre commande",       icon: Clock,        bg: "bg-blue-50",   iconColor: "text-blue-500"  },
  preparing: { label: "En préparation",        sublabel: "La cuisine s'affaire à préparer votre commande", icon: ChefHat,      bg: "bg-amber-50",  iconColor: "text-amber-500" },
  ready:     { label: "Votre commande est prête !", sublabel: "Vous pouvez récupérer votre commande",      icon: BellRing,     bg: "bg-green-50",  iconColor: "text-green-500" },
  served:    { label: "Servie — Bon appétit !", sublabel: "Nous espérons que vous apprécierez",            icon: CheckCircle2, bg: "bg-green-50",  iconColor: "text-green-500" },
  cancelled: { label: "Commande annulée",       sublabel: "",                                              icon: XCircle,      bg: "bg-red-50",    iconColor: "text-red-400"   },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);

  const [tracking,   setTracking]   = useState<TrackingData | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isError,    setIsError]    = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API}/orders/${orderId}/tracking`);
        if (!res.ok) { setIsError(true); return; }
        const data: TrackingData = await res.json();
        setTracking(data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, [orderId]);

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-order", { orderId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("status-update", (payload: { status: OrderStatus }) => {
      setTracking((prev) => prev ? { ...prev, status: payload.status } : prev);
      setLastUpdate(new Date());
      // Sync localStorage so the banner on /order reflects the latest status
      if (tracking?.tenant?.slug) {
        updateStoredStatus(tracking.tenant.slug, orderId, payload.status);
      }
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-sm text-slate-400 font-medium">Chargement du suivi…</p>
    </div>
  );

  if (isError || !tracking) return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col items-center justify-center p-8 text-center gap-5">
      <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center shadow-sm">
        <UtensilsCrossed className="h-9 w-9 text-slate-300" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800">Commande introuvable</p>
        <p className="text-sm text-slate-400 mt-1">Ce lien de suivi est invalide ou a expiré.</p>
      </div>
      <a href={`/menu/${slug}`} className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
        Retour au menu
      </a>
    </div>
  );

  const color       = primary(tracking.tenant.primaryColor);
  const currency    = tracking.tenant.currency ?? "XAF";
  const isCancelled = tracking.status === "cancelled";
  const currentStep = STATUS_ORDER[tracking.status];
  const hero        = STATUS_HERO[tracking.status];

  return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <a
            href={`/menu/${slug}/order`}
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </a>

          {/* Restaurant identity */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {tracking.tenant.logo ? (
              <div className="relative h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={tracking.tenant.logo} alt={tracking.tenant.name} fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <UtensilsCrossed className="h-4 w-4" style={{ color }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate leading-none">{tracking.tenant.name}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">#{orderId.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? "bg-green-500" : "bg-slate-300"}`} />
            </span>
            <span className="text-xs font-medium text-slate-400">{connected ? "En direct" : "Reconnexion…"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-4">

        {/* Cancelled */}
        {isCancelled ? (
          <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-8 flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">Commande annulée</p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Cette commande a été annulée. N&apos;hésitez pas à en passer une nouvelle.
              </p>
            </div>
            <a
              href={`/menu/${slug}/order`}
              className="mt-2 inline-flex items-center gap-2 font-bold text-sm bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Nouvelle commande
            </a>
          </div>
        ) : (
          <>
            {/* Status hero */}
            <div className={`${hero.bg} rounded-3xl p-5 flex items-center gap-4 border border-white shadow-sm`}>
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <hero.icon className={`h-7 w-7 ${hero.iconColor}`} />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight">{hero.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{hero.sublabel}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-0">
              {STEPS.map((step, index) => {
                const stepIndex = STATUS_ORDER[step.status];
                const isDone    = stepIndex < currentStep;
                const isActive  = stepIndex === currentStep;
                const isLast    = index === STEPS.length - 1;

                return (
                  <div key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${isDone ? "bg-green-500" : isActive ? "bg-slate-900 shadow-lg" : "bg-slate-100"}`}>
                        {isDone
                          ? <CheckCircle2 className="h-4 w-4 text-white" />
                          : <step.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        }
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 transition-all duration-700 ${isDone ? "bg-green-300" : "bg-slate-100"}`} style={{ minHeight: 20 }} />
                      )}
                    </div>
                    <div className={`flex-1 pt-1.5 ${isLast ? "pb-0" : "pb-5"}`}>
                      <p className={`text-sm font-bold leading-none transition-colors ${isDone ? "text-green-600" : isActive ? "text-slate-900" : "text-slate-400"}`}>
                        {step.label}
                        {isActive && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                            </span>
                            Maintenant
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? "text-slate-500" : "text-slate-300"}`}>{step.sublabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Summary header */}
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-400" />
            <p className="font-black text-slate-900 text-sm">Récapitulatif</p>
            {tracking.table && (
              <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                Table {tracking.table.number}
              </span>
            )}
            {tracking.type === "takeaway" && (
              <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                À emporter
              </span>
            )}
          </div>

          {/* Items */}
          <div className="px-5 py-3 divide-y divide-slate-50">
            {tracking.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  {item.image
                    ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="44px" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
                        <UtensilsCrossed className="h-4 w-4 opacity-30" style={{ color }} />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate leading-none">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">× {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-slate-900 flex-shrink-0">
                  {fmt(Number(item.price) * item.quantity, currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Special notes */}
          {tracking.specialNotes && (
            <div className="mx-5 mb-3 px-3 py-2.5 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 font-medium mb-0.5">Note</p>
              <p className="text-xs text-slate-600">{tracking.specialNotes}</p>
            </div>
          )}

          {/* Total */}
          {tracking.total != null && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Total</span>
              <span className="text-xl font-black text-slate-900">{fmt(tracking.total, currency)}</span>
            </div>
          )}
        </div>

        {/* Last update */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
          <RefreshCw className="h-3 w-3" />
          {lastUpdate
            ? `Mis à jour à ${lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "En attente de mise à jour…"
          }
        </div>

        {/* Add more CTA */}
        <a
          href={`/menu/${slug}/order`}
          className="flex items-center justify-center gap-2 w-full font-bold text-sm py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] border-2"
          style={{ borderColor: color, color }}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Ajouter une autre commande
        </a>

      </main>
    </div>
  );
}
