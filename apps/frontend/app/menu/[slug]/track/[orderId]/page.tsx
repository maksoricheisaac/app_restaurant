'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle2, Clock, ChefHat, BellRing, XCircle,
  ArrowLeft, UtensilsCrossed, RefreshCw, Receipt, Bike, Timer,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { updateStoredStatus, type OrderStatus } from '@/lib/order-storage';
import { formatCurrency } from '@/lib/order-utils';
import { WARM, normalizeHex, readableOn, withAlpha } from '../../_lib/theme';
import { StatusBlock } from '../../_components/states';
import { TrackSkeleton } from '../../_components/skeletons';
import { TrackingTimeline } from '../../_components/tracking-timeline';

interface ItemOption { groupName: string; optionName: string; priceDelta: number }
interface OrderItem {
  id: string; name: string; quantity: number;
  price: string | number; image: string | null;
  options?: ItemOption[] | null;
}
interface TrackingData {
  id: string; status: OrderStatus;
  type: 'dine_in' | 'takeaway' | 'delivery';
  total: string | number | null;
  createdAt: string; updatedAt: string;
  specialNotes: string | null;
  deliveryFee: string | number | null;
  deliveryAddress: string | null;
  table: { number: number } | null;
  deliveryZone: { name: string; deliveryTime: number | null } | null;
  tenant: { name: string; logo: string | null; primaryColor: string | null; currency: string; slug: string };
  orderItems: OrderItem[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const SOCKET_URL = API.replace(/\/api\/v1\/?$/, '');

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0, preparing: 1, ready: 2, served: 3, cancelled: -1,
};

const HERO: Record<OrderStatus, { label: string; sub: string; icon: typeof Clock; tone: 'brand' | 'success' | 'danger' }> = {
  pending: { label: 'Commande reçue', sub: 'Le restaurant a bien reçu votre commande', icon: Clock, tone: 'brand' },
  preparing: { label: 'En préparation', sub: "La cuisine s'affaire à préparer votre commande", icon: ChefHat, tone: 'brand' },
  ready: { label: 'Votre commande est prête !', sub: 'Vous pouvez la récupérer', icon: BellRing, tone: 'success' },
  served: { label: 'Servie — Bon appétit !', sub: 'Nous espérons que vous vous régalez', icon: CheckCircle2, tone: 'success' },
  cancelled: { label: 'Commande annulée', sub: '', icon: XCircle, tone: 'danger' },
};

/** Estimation du temps restant, selon statut / type de service. */
function estimateEta(t: TrackingData): string | null {
  if (t.status === 'served' || t.status === 'cancelled') return null;
  if (t.status === 'ready') return t.type === 'delivery' ? 'En route bientôt' : 'À récupérer';
  if (t.type === 'delivery' && t.deliveryZone?.deliveryTime)
    return `~${t.deliveryZone.deliveryTime} min`;
  if (t.status === 'preparing') return '~15 min';
  return '~20 min';
}

export default function TrackOrderPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const { slug, orderId } = use(params);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API}/orders/${orderId}/tracking`);
        if (!res.ok) { setIsError(true); return; }
        setTracking(await res.json());
      } catch { setIsError(true); }
      finally { setIsLoading(false); }
    }
    fetchStatus();
  }, [orderId]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); socket.emit('join-order', { orderId }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('status-update', (payload: { status: OrderStatus }) => {
      setTracking((prev) => (prev ? { ...prev, status: payload.status } : prev));
      setLastUpdate(new Date());
      updateStoredStatus(slug, orderId, payload.status);
    });
    return () => { socket.disconnect(); };
  }, [orderId, slug]);

  if (isLoading) return <TrackSkeleton />;

  if (isError || !tracking)
    return (
      <StatusBlock
        title="Commande introuvable"
        subtitle="Ce lien de suivi est invalide ou a expiré."
        action={
          <a href={`/menu/${slug}`} className="text-sm font-semibold transition-colors" style={{ color: WARM.muted }}>
            Retour au menu
          </a>
        }
      />
    );

  const color = normalizeHex(tracking.tenant.primaryColor);
  const onBrand = readableOn(color);
  const currency = tracking.tenant.currency ?? 'XAF';
  const isCancelled = tracking.status === 'cancelled';
  const currentStep = STATUS_ORDER[tracking.status];
  const hero = HERO[tracking.status];
  const eta = estimateEta(tracking);

  const heroBg =
    hero.tone === 'success' ? '#f0faf3' : hero.tone === 'danger' ? '#fdf2f2' : withAlpha(color, 0.08);
  const heroIconBg =
    hero.tone === 'success' ? '#16a34a' : hero.tone === 'danger' ? '#dc2626' : color;
  const heroIconFg = hero.tone === 'brand' ? onBrand : '#fff';

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: WARM.page }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: WARM.card, borderBottom: `1px solid ${WARM.border}` }}>
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3.5">
          <a href={`/menu/${slug}`} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors" style={{ backgroundColor: WARM.surfaceAlt }} aria-label="Retour au menu">
            <ArrowLeft className="h-4 w-4" style={{ color: WARM.inkSoft }} />
          </a>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {tracking.tenant.logo ? (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                <Image src={tracking.tenant.logo} alt={tracking.tenant.name} fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(color, 0.1) }}>
                <UtensilsCrossed className="h-4 w-4" style={{ color }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none" style={{ color: WARM.ink }}>{tracking.tenant.name}</p>
              <p className="mt-0.5 font-mono text-xs" style={{ color: WARM.faint }}>#{orderId.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-[#cfc7b8]'}`} />
            </span>
            <span className="text-xs font-medium" style={{ color: WARM.faint }}>{connected ? 'En direct' : 'Reconnexion…'}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-6">
        {isCancelled ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <p className="font-display text-2xl" style={{ color: WARM.ink }}>Commande annulée</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: WARM.faint }}>
                Cette commande a été annulée. N&apos;hésitez pas à en passer une nouvelle.
              </p>
            </div>
            <a href={`/menu/${slug}`} className="mt-1 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-colors" style={{ backgroundColor: WARM.ink }}>
              Nouvelle commande
            </a>
          </div>
        ) : (
          <>
            {/* Status hero */}
            <div className="flex items-center gap-4 rounded-3xl border border-white p-5 shadow-sm" style={{ backgroundColor: heroBg }}>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: heroIconBg, color: heroIconFg }}>
                <hero.icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-tight" style={{ color: WARM.ink }}>{hero.label}</p>
                <p className="mt-0.5 text-sm" style={{ color: WARM.muted }}>{hero.sub}</p>
              </div>
              {eta && (
                <div className="flex flex-shrink-0 flex-col items-center rounded-2xl px-3 py-2" style={{ backgroundColor: withAlpha(WARM.card, 0.7) }}>
                  <Timer className="h-4 w-4" style={{ color }} />
                  <span className="mt-0.5 whitespace-nowrap text-xs font-bold tabular-nums" style={{ color: WARM.ink }}>{eta}</span>
                </div>
              )}
            </div>

            {/* Delivery address */}
            {tracking.type === 'delivery' && tracking.deliveryAddress && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
                <Bike className="h-4 w-4 flex-shrink-0" style={{ color }} />
                <span className="text-sm" style={{ color: WARM.inkSoft }}>{tracking.deliveryAddress}</span>
              </div>
            )}

            <TrackingTimeline currentStep={currentStep} color={color} onBrand={onBrand} />
          </>
        )}

        {/* Récapitulatif */}
        <div className="overflow-hidden rounded-3xl" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${WARM.surface}` }}>
            <Receipt className="h-4 w-4" style={{ color: WARM.faint }} />
            <p className="text-sm font-bold" style={{ color: WARM.ink }}>Récapitulatif</p>
            {tracking.table && (
              <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: withAlpha(color, 0.1), color }}>
                Table {tracking.table.number}
              </span>
            )}
            {tracking.type === 'takeaway' && (
              <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: WARM.surfaceAlt, color: WARM.inkSoft }}>À emporter</span>
            )}
            {tracking.type === 'delivery' && (
              <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: WARM.surfaceAlt, color: WARM.inkSoft }}>Livraison</span>
            )}
          </div>

          <ul className="divide-y px-5" style={{ borderColor: WARM.surface }}>
            {tracking.orderItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: WARM.surface }}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="44px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${withAlpha(color, 0.14)}, ${withAlpha(color, 0.04)})` }}>
                      <UtensilsCrossed className="h-4 w-4 opacity-30" style={{ color }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight" style={{ color: WARM.ink }}>{item.name}</p>
                  {item.options && item.options.length > 0 && (
                    <p className="mt-0.5 text-xs" style={{ color: WARM.faint }}>
                      {item.options.map((o) => o.optionName).join(' · ')}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs" style={{ color: WARM.faint }}>× {item.quantity}</p>
                </div>
                <p className="flex-shrink-0 text-sm font-bold" style={{ color: WARM.ink }}>
                  {formatCurrency(Number(item.price) * item.quantity, currency)}
                </p>
              </li>
            ))}
          </ul>

          {tracking.specialNotes && (
            <div className="mx-5 mb-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: WARM.surface }}>
              <p className="mb-0.5 text-xs font-medium" style={{ color: WARM.faint }}>Note</p>
              <p className="text-xs" style={{ color: WARM.inkSoft }}>{tracking.specialNotes}</p>
            </div>
          )}

          {tracking.deliveryFee != null && Number(tracking.deliveryFee) > 0 && (
            <div className="flex items-center justify-between px-5 py-2 text-sm" style={{ color: WARM.muted }}>
              <span>Livraison</span>
              <span className="tabular-nums">{formatCurrency(Number(tracking.deliveryFee), currency)}</span>
            </div>
          )}

          {tracking.total != null && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${WARM.border}` }}>
              <span className="text-sm font-medium" style={{ color: WARM.inkSoft }}>Total</span>
              <span className="text-xl font-bold" style={{ color: WARM.ink }}>{formatCurrency(Number(tracking.total), currency)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: WARM.faint }}>
          <RefreshCw className="h-3 w-3" />
          {lastUpdate
            ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'En attente de mise à jour…'}
        </div>

        <a
          href={`/menu/${slug}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.98]"
          style={{ borderColor: color, color }}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Commander à nouveau
        </a>
      </main>
    </div>
  );
}
