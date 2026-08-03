'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Store,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/order-utils';
import { persistOrder } from '@/lib/order-storage';
import type { ServiceFlags, DeliveryZone, ServiceType } from '../_lib/types';
import { WARM, normalizeHex, readableOn, withAlpha } from '../_lib/theme';
import { useMenuCart, lineUnitPrice } from '../_lib/useMenuCart';
import { QuantityStepper, ItemImage } from '../_components/primitives';
import { InlineEmpty } from '../_components/states';
import { MenuSkeleton } from '../_components/skeletons';
import { OrderConfirmation } from '../_components/order-confirmation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface Restaurant {
  name: string;
  logo: string | null;
  primaryColor: string | null;
  currency: string;
}

const SERVICE_META: Record<ServiceType, { label: string; icon: typeof Store }> = {
  dine_in: { label: 'Sur place', icon: Store },
  takeaway: { label: 'À emporter', icon: ShoppingBag },
  delivery: { label: 'Livraison', icon: Bike },
};

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table') ?? searchParams.get('tableId');

  const cart = useMenuCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [services, setServices] = useState<ServiceFlags>({ dineIn: true, takeaway: true, delivery: false });
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);

  const [serviceType, setServiceType] = useState<ServiceType>('takeaway');
  const [zoneId, setZoneId] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const color = normalizeHex(restaurant?.primaryColor);
  const onBrand = readableOn(color);
  const currency = restaurant?.currency ?? 'XAF';

  // ── Fetch restaurant context (services, zones, session token) ──────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/public-menu`);
        if (!res.ok) {
          toast.error('Restaurant introuvable');
          return;
        }
        const data = await res.json();
        setRestaurant(data.restaurant);
        setServices(data.services ?? { dineIn: true, takeaway: true, delivery: false });
        setZones(data.deliveryZones ?? []);
        if (data.sessionToken) setSessionToken(data.sessionToken);
        // Type de service par défaut : sur place si table scannée, sinon 1er dispo.
        if (tableId && (data.services?.dineIn ?? true)) setServiceType('dine_in');
        else if (data.services?.takeaway ?? true) setServiceType('takeaway');
        else if (data.services?.delivery) setServiceType('delivery');
      } catch {
        toast.error('Impossible de charger la commande');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug, tableId]);

  const availableServices = useMemo(() => {
    const out: ServiceType[] = [];
    if (tableId && services.dineIn) out.push('dine_in');
    if (services.takeaway) out.push('takeaway');
    if (services.delivery) out.push('delivery');
    return out.length > 0 ? out : ['takeaway' as ServiceType];
  }, [services, tableId]);

  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const deliveryFee = serviceType === 'delivery' && selectedZone ? Number(selectedZone.price) : 0;
  const total = cart.subtotal + deliveryFee;

  const belowMinOrder =
    serviceType === 'delivery' &&
    selectedZone?.minOrder != null &&
    cart.subtotal < Number(selectedZone.minOrder);

  // ── Validation ─────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (serviceType === 'delivery') {
      if (!zoneId) e.zone = 'Choisissez une zone de livraison';
      if (!address.trim()) e.address = 'Renseignez votre adresse';
      if (belowMinOrder) e.min = `Minimum ${formatCurrency(Number(selectedZone?.minOrder), currency)} pour cette zone`;
    }
    if ((serviceType === 'takeaway' || serviceType === 'delivery') && !name.trim())
      e.name = 'Renseignez votre nom';
    return e;
  }, [serviceType, zoneId, address, name, belowMinOrder, selectedZone, currency]);

  const canSubmit = cart.lines.length > 0 && Object.keys(errors).length === 0;

  async function submitOrder() {
    setTouched(true);
    if (!canSubmit) {
      toast.error('Merci de compléter les informations manquantes');
      return;
    }
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-menu-session'] = sessionToken;

      const res = await fetch(`${API}/public-menu/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: serviceType,
          tableId: serviceType === 'dine_in' ? tableId || undefined : undefined,
          deliveryZoneId: serviceType === 'delivery' ? zoneId : undefined,
          deliveryAddress: serviceType === 'delivery' ? address.trim() : undefined,
          customerName: name.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          specialNotes: notes.trim() || undefined,
          items: cart.lines.map((l) => ({
            menuItemId: l.itemId,
            quantity: l.quantity,
            selectedOptionIds: l.selectedOptions.map((o) => o.optionId),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || `Erreur ${res.status}`);
      }

      const data = await res.json();

      persistOrder({
        orderId: data.orderId,
        ref: data.orderId.slice(-8).toUpperCase(),
        createdAt: new Date().toISOString(),
        itemCount: cart.itemCount,
        total,
        currency,
        status: 'pending',
        restaurantName: restaurant?.name ?? '',
      });

      cart.clear();
      setOrderDone(data.orderId);

      // Rafraîchit le token de session pour une éventuelle commande suivante.
      fetch(`${API}/public-menu`)
        .then((r) => r.json())
        .then((d) => { if (d.sessionToken) setSessionToken(d.sessionToken); })
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (isLoading) return <MenuSkeleton />;

  if (orderDone)
    return (
      <OrderConfirmation
        orderId={orderDone}
        color={color}
        onBrand={onBrand}
        isDineIn={serviceType === 'dine_in'}
        onNewOrder={() => (window.location.href = '/menu')}
      />
    );

  if (cart.hydrated && cart.lines.length === 0)
    return (
      <div className="min-h-screen" style={{ backgroundColor: WARM.page }}>
        <CheckoutHeader restaurant={restaurant} color={color} />
        <InlineEmpty title="Votre panier est vide" subtitle="Ajoutez des plats depuis le menu pour commander." />
        <div className="flex justify-center pb-10">
          <a
            href={'/menu'}
            className="rounded-2xl px-6 py-3 text-sm font-bold"
            style={{ backgroundColor: color, color: onBrand }}
          >
            Retour au menu
          </a>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: WARM.page }}>
      <CheckoutHeader restaurant={restaurant} color={color} tableId={tableId} />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-40 pt-5">
        {/* Type de service */}
        <Section title="Mode de service">
          <div className="grid grid-cols-3 gap-2">
            {availableServices.map((s) => {
              const meta = SERVICE_META[s];
              const active = serviceType === s;
              const Icon = meta.icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServiceType(s)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-xs font-semibold transition-colors touch-manipulation"
                  style={{
                    borderColor: active ? color : WARM.border,
                    backgroundColor: active ? withAlpha(color, 0.06) : WARM.card,
                    color: active ? color : WARM.muted,
                  }}
                  aria-pressed={active}
                >
                  <Icon className="h-5 w-5" />
                  {meta.label}
                </button>
              );
            })}
          </div>
          {serviceType === 'dine_in' && tableId && (
            <p className="mt-3 rounded-xl px-3 py-2 text-center text-xs font-medium" style={{ backgroundColor: withAlpha(color, 0.08), color }}>
              Commande servie à votre table
            </p>
          )}
        </Section>

        {/* Delivery details */}
        {serviceType === 'delivery' && (
          <Section title="Livraison">
            <Field label="Zone de livraison" error={touched ? errors.zone : undefined}>
              <div className="space-y-2">
                {zones.length === 0 && (
                  <p className="text-sm" style={{ color: WARM.faint }}>Aucune zone de livraison configurée.</p>
                )}
                {zones.map((z) => {
                  const active = zoneId === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZoneId(z.id)}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors"
                      style={{ borderColor: active ? color : WARM.border, backgroundColor: active ? withAlpha(color, 0.06) : WARM.card }}
                    >
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: WARM.ink }}>{z.name}</span>
                        {z.deliveryTime && (
                          <span className="text-xs" style={{ color: WARM.faint }}>~{z.deliveryTime} min</span>
                        )}
                        {z.minOrder != null && (
                          <span className="ml-2 text-xs" style={{ color: WARM.faint }}>
                            min. {formatCurrency(Number(z.minOrder), currency)}
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>
                        {formatCurrency(Number(z.price), currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Adresse de livraison" error={touched ? errors.address : undefined}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rue, quartier, points de repère…"
                className="input-warm"
                autoComplete="street-address"
              />
            </Field>
            {touched && errors.min && (
              <p className="text-sm font-medium text-red-500" role="alert">{errors.min}</p>
            )}
          </Section>
        )}

        {/* Customer info (takeaway / delivery) */}
        {(serviceType === 'takeaway' || serviceType === 'delivery') && (
          <Section title="Vos coordonnées">
            <Field label="Nom" error={touched ? errors.name : undefined}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="input-warm"
                autoComplete="name"
              />
            </Field>
            <Field label="Téléphone (optionnel)">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="Pour vous prévenir"
                className="input-warm"
                autoComplete="tel"
              />
            </Field>
          </Section>
        )}

        {/* Order recap */}
        <Section title="Votre commande">
          <ul className="divide-y" style={{ borderColor: WARM.border }}>
            {cart.lines.map((line) => (
              <li key={line.lineId} className="flex items-start gap-3 py-3 first:pt-0">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: WARM.surface }}>
                  <ItemImage src={line.image} alt={line.name} color={color} sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight" style={{ color: WARM.ink }}>{line.name}</p>
                  {line.selectedOptions.length > 0 && (
                    <p className="mt-0.5 text-xs" style={{ color: WARM.faint }}>
                      {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-bold" style={{ color }}>
                    {formatCurrency(lineUnitPrice(line) * line.quantity, currency)}
                  </p>
                </div>
                <QuantityStepper
                  quantity={line.quantity}
                  onChange={(q) => cart.setQuantity(line.lineId, q)}
                  color={color}
                  onBrand={onBrand}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </Section>

        {/* Notes */}
        <Section title="Note pour le restaurant (optionnel)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Allergies, cuisson, instructions de livraison…"
            className="input-warm resize-none"
          />
        </Section>

        {/* Totals */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
          <Row label="Sous-total" value={formatCurrency(cart.subtotal, currency)} color={WARM.muted} />
          {serviceType === 'delivery' && (
            <Row
              label="Frais de livraison"
              value={deliveryFee > 0 ? formatCurrency(deliveryFee, currency) : '—'}
              color={WARM.muted}
            />
          )}
          <div className="mt-2 flex items-center justify-between border-t pt-3" style={{ borderColor: WARM.border }}>
            <span className="text-sm font-medium" style={{ color: WARM.inkSoft }}>Total</span>
            <span className="text-2xl font-bold" style={{ color: WARM.ink }}>{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </main>

      {/* Sticky submit */}
      <div className="pb-safe-4 fixed inset-x-0 bottom-0 z-40 px-4 pt-4" style={{ background: `linear-gradient(to top, ${WARM.page} 60%, transparent)` }}>
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={submitOrder}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: color, color: onBrand, boxShadow: `0 10px 34px ${withAlpha(color, 0.33)}` }}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Confirmer · {formatCurrency(total, currency)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants locaux ─────────────────────────────────────────────────────

function CheckoutHeader({
  restaurant,
  color,
  tableId,
}: {
  restaurant: Restaurant | null;
  color: string;
  tableId?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 shadow-sm" style={{ backgroundColor: WARM.card, borderBottom: `1px solid ${WARM.border}` }}>
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <a
          href={`/menu${tableId ? `?tableId=${tableId}` : ''}`}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: WARM.surfaceAlt }}
          aria-label="Retour au menu"
        >
          <ArrowLeft className="h-4 w-4" style={{ color: WARM.inkSoft }} />
        </a>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {restaurant?.logo ? (
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl">
              <Image src={restaurant.logo} alt={restaurant.name} fill className="object-cover" sizes="36px" />
            </div>
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: withAlpha(color, 0.1) }}>
              <UtensilsCrossed className="h-4 w-4" style={{ color }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-none" style={{ color: WARM.ink }}>{restaurant?.name ?? 'Commande'}</p>
            <p className="mt-0.5 text-xs" style={{ color: WARM.faint }}>Finaliser la commande</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4" style={{ color: WARM.fainter }} />
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-4" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
      <h2 className="mb-3 text-sm font-bold" style={{ color: WARM.ink }}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: WARM.muted }}>{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-red-500" role="alert">{error}</p>}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm" style={{ color }}>{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: WARM.inkSoft }}>{value}</span>
    </div>
  );
}
