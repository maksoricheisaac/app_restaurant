'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Check,
  Clock,
  Loader2,
  Minus,
  Plus,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/components/motion/in-view';
import { WARM, normalizeHex, readableOn, withAlpha } from '../_lib/theme';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export interface ReservationRestaurant {
  name: string;
  primaryColor: string | null;
  logo: string | null;
}

const SLOTS_LUNCH = ['12:00', '12:30', '13:00', '13:30', '14:00'];
const SLOTS_DINNER = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

const STEPS = [
  { key: 'details', label: 'Détails' },
  { key: 'contact', label: 'Coordonnées' },
  { key: 'review', label: 'Confirmation' },
] as const;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Wizard de réservation en 3 étapes, avec validation par étape et transitions. */
export function ReservationWizard({
  restaurant,
  maxGuests,
  maxDays,
  sessionToken,
}: {
  restaurant: ReservationRestaurant | null;
  maxGuests: number;
  maxDays: number;
  sessionToken: string | null;
}) {
  const color = normalizeHex(restaurant?.primaryColor);
  const onBrand = readableOn(color);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const stepRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLSpanElement>(null);

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const max = new Date();
    max.setDate(max.getDate() + maxDays);
    return { minDate: today.toISOString().split('T')[0], maxDate: max.toISOString().split('T')[0] };
  }, [maxDays]);

  const prettyDate = date
    ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  // ── Validation par étape ────────────────────────────────────────────────────
  const stepErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 0 && !date) e.date = 'Choisissez une date';
    if (step === 1) {
      if (!name.trim()) e.name = 'Votre nom est requis';
      if (!email.trim()) e.email = 'Votre email est requis';
      else if (!isEmail(email)) e.email = 'Email invalide';
    }
    return e;
  }, [step, date, name, email]);

  const mark = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  // ── Transition d'étape (GSAP, coupée en reduced-motion) ─────────────────────
  useGSAP(
    () => {
      const el = stepRef.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, x: dir * 30 },
        { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out' },
      );
    },
    { dependencies: [step], scope: stepRef },
  );

  // ── Pop du compteur de convives ─────────────────────────────────────────────
  useGSAP(
    () => {
      const el = guestRef.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(el, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
    },
    { dependencies: [guests], scope: guestRef },
  );

  function goNext() {
    if (Object.keys(stepErrors).length > 0) {
      // Fait apparaître les erreurs de l'étape courante.
      if (step === 0) setTouched((t) => ({ ...t, date: true }));
      if (step === 1) setTouched((t) => ({ ...t, name: true, email: true }));
      return;
    }
    if (step < STEPS.length - 1) {
      setDir(1);
      setStep((s) => s + 1);
    } else {
      void submit();
    }
  }

  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['x-menu-session'] = sessionToken;
      const res = await fetch(`${API}/public-menu/reservation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          time: time || undefined,
          guests,
          customerName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || `Erreur ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <SuccessScreen restaurant={restaurant} color={color} onBrand={onBrand} prettyDate={prettyDate} guests={guests} time={time} />
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: WARM.page }}>
      <Hero
        restaurant={restaurant}
        color={color}
        step={step}
        onBack={goBack}
      />

      {/* Progress stepper */}
      <div className="mx-auto -mt-6 w-full max-w-md px-4">
        <Stepper current={step} color={color} onBrand={onBrand} />
      </div>

      {/* Contenu de l'étape */}
      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-32 pt-5">
        <div ref={stepRef}>
          {step === 0 && (
            <div className="space-y-4">
              <Card>
                <Label icon={Users}>Nombre de convives</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: WARM.muted }}>Combien serez-vous ?</span>
                  <div className="flex items-center gap-3">
                    <StepBtn onClick={() => setGuests((g) => Math.max(1, g - 1))} color={color} onBrand={onBrand} disabled={guests <= 1} ariaLabel="Moins de convives">
                      <Minus className="h-4 w-4" />
                    </StepBtn>
                    <span ref={guestRef} className="inline-block w-10 text-center text-2xl font-bold tabular-nums" style={{ color: WARM.ink }}>
                      {guests}
                    </span>
                    <StepBtn onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} color={color} onBrand={onBrand} disabled={guests >= maxGuests} ariaLabel="Plus de convives">
                      <Plus className="h-4 w-4" />
                    </StepBtn>
                  </div>
                </div>
                {guests >= maxGuests && (
                  <p className="mt-2 text-xs" style={{ color: WARM.faint }}>
                    Pour plus de {maxGuests} personnes, contactez directement le restaurant.
                  </p>
                )}
              </Card>

              <Card>
                <Label icon={CalendarCheck}>Date</Label>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => mark('date')}
                  className="input-warm"
                />
                {touched.date && stepErrors.date && <ErrText>{stepErrors.date}</ErrText>}
              </Card>

              <Card>
                <Label icon={Clock}>Heure <span className="font-normal" style={{ color: WARM.faint }}>(optionnel)</span></Label>
                <SlotRow title="Déjeuner" slots={SLOTS_LUNCH} value={time} onSelect={setTime} color={color} onBrand={onBrand} />
                <SlotRow title="Dîner" slots={SLOTS_DINNER} value={time} onSelect={setTime} color={color} onBrand={onBrand} />
              </Card>
            </div>
          )}

          {step === 1 && (
            <Card>
              <Label icon={User}>Vos coordonnées</Label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => mark('name')} placeholder="Votre nom" className="input-warm" autoComplete="name" />
                  {touched.name && stepErrors.name && <ErrText>{stepErrors.name}</ErrText>}
                </div>
                <div className="space-y-1.5">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => mark('email')} type="email" inputMode="email" placeholder="Email" className="input-warm" autoComplete="email" />
                  {touched.email && stepErrors.email && <ErrText>{stepErrors.email}</ErrText>}
                </div>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="Téléphone (optionnel)" className="input-warm" autoComplete="tel" />
              </div>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <Label icon={CheckCircle2}>Récapitulatif</Label>
                <dl className="divide-y" style={{ borderColor: WARM.border }}>
                  <RecapRow icon={Users} label="Convives" value={`${guests} personne${guests > 1 ? 's' : ''}`} />
                  <RecapRow icon={CalendarCheck} label="Date" value={prettyDate ?? '—'} />
                  <RecapRow icon={Clock} label="Heure" value={time || 'À définir'} />
                  <RecapRow icon={User} label="Nom" value={name} />
                  <RecapRow icon={CheckCircle2} label="Email" value={email} />
                  {phone.trim() && <RecapRow icon={CheckCircle2} label="Téléphone" value={phone} />}
                </dl>
              </Card>
              <p className="px-1 text-center text-xs leading-relaxed" style={{ color: WARM.faint }}>
                Cette demande sera confirmée par {restaurant?.name ?? 'le restaurant'} — elle ne réserve
                pas automatiquement votre table.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation bas de page */}
      <div className="pb-safe-4 fixed inset-x-0 bottom-0 z-40 px-4 pt-4" style={{ background: `linear-gradient(to top, ${WARM.page} 62%, transparent)` }}>
        <div className="mx-auto flex max-w-md items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition-colors"
              style={{ backgroundColor: WARM.card, borderColor: WARM.borderStrong, color: WARM.inkSoft }}
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={isSubmitting}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: color, color: onBrand, boxShadow: `0 8px 24px ${withAlpha(color, 0.28)}` }}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLast ? (
              <><CalendarCheck className="h-5 w-5" /> Envoyer la demande</>
            ) : (
              <>Continuer <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────────
function Hero({
  restaurant,
  color,
  step,
  onBack,
}: {
  restaurant: ReservationRestaurant | null;
  color: string;
  step: number;
  onBack: () => void;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${color} 0%, ${withAlpha(color, 0.85)} 45%, ${WARM.dark} 100%)` }} />
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white opacity-[0.08] blur-2xl" />
      <div className="relative mx-auto max-w-md px-5 pb-10 pt-8">
        {step === 0 ? (
          <a href={'/menu'} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Retour au menu
          </a>
        ) : (
          <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Étape précédente
          </button>
        )}
        <div className="flex items-center gap-3">
          {restaurant?.logo ? (
            <Image src={restaurant.logo} alt={restaurant.name} width={56} height={56} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/25" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-white/25" style={{ backgroundColor: withAlpha(color, 0.75) }}>
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Réservation</p>
            <h1 className="font-display text-2xl leading-tight text-white">{restaurant?.name}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ current, color, onBrand }: { current: number; color: string; onBrand: string }) {
  return (
    <ol className="flex items-center rounded-2xl px-4 py-3 shadow-sm" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={s.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300"
                style={{
                  backgroundColor: done || active ? color : WARM.surfaceAlt,
                  color: done || active ? onBrand : WARM.faint,
                }}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className="hidden text-xs font-semibold sm:inline"
                style={{ color: active ? WARM.ink : WARM.faint }}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <span className="mx-2 h-0.5 flex-1 rounded-full" style={{ backgroundColor: done ? color : WARM.surfaceAlt }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Success ─────────────────────────────────────────────────────────────────────
function SuccessScreen({
  restaurant,
  color,
  onBrand,
  prettyDate,
  guests,
  time,
}: {
  restaurant: ReservationRestaurant | null;
  color: string;
  onBrand: string;
  prettyDate: string | null;
  guests: number;
  time: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6" style={{ backgroundColor: WARM.page }}>
      <div className="w-full max-w-sm space-y-4 rounded-3xl p-8 text-center shadow-lg" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl" style={{ color: WARM.ink }}>Demande envoyée !</h2>
        <p className="text-sm leading-relaxed" style={{ color: WARM.muted }}>
          {restaurant?.name} a bien reçu votre demande pour {guests} personne{guests > 1 ? 's' : ''}
          {prettyDate ? ` le ${prettyDate}` : ''}{time ? ` à ${time}` : ''} et vous contactera pour la confirmer.
        </p>
        <a href={'/menu'} className="inline-block rounded-xl px-6 py-3 text-sm font-bold" style={{ backgroundColor: color, color: onBrand }}>
          Retour au menu
        </a>
      </div>
    </div>
  );
}

// ── Petits composants ───────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
      {children}
    </div>
  );
}

function Label({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: WARM.ink }}>
      <Icon className="h-4 w-4" style={{ color: WARM.faint }} />
      {children}
    </p>
  );
}

function SlotRow({
  title,
  slots,
  value,
  onSelect,
  color,
  onBrand,
}: {
  title: string;
  slots: string[];
  value: string;
  onSelect: (v: string) => void;
  color: string;
  onBrand: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1.5 text-xs font-semibold" style={{ color: WARM.faint }}>{title}</p>
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {slots.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(active ? '' : s)}
              aria-pressed={active}
              className="flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors"
              style={{
                borderColor: active ? color : WARM.border,
                backgroundColor: active ? color : WARM.card,
                color: active ? onBrand : WARM.muted,
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  color,
  onBrand,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
  onBrand: string;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 touch-manipulation"
      style={{ backgroundColor: color, color: onBrand }}
    >
      {children}
    </button>
  );
}

function RecapRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm" style={{ color: WARM.muted }}>
        <Icon className="h-4 w-4" style={{ color: WARM.faint }} />
        {label}
      </span>
      <span className="truncate text-sm font-semibold capitalize" style={{ color: WARM.ink }}>{value}</span>
    </div>
  );
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-red-500" role="alert">{children}</p>;
}
