'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Lock, ShieldCheck, CreditCard, Smartphone, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import api from '@/lib/api-client';
import { currencySymbol, type PlanCatalog } from '@/config/plans';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  data: OnboardingData;
  plan?: PlanCatalog;
  onBack: () => void;
  /** Purge du brouillon localStorage une fois l'inscription réussie. */
  onComplete?: () => void;
}

type Method = 'card' | 'mobile';

const METHODS: { id: Method; label: string; icon: typeof CreditCard; desc: string }[] = [
  { id: 'card', label: 'Carte prépayée', icon: CreditCard, desc: 'Visa · Mastercard' },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone, desc: 'Orange, MTN, Wave…' },
];

const MOBILE_OPERATORS = [
  'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Wave', 'Free Money', 'Airtel Money',
];

// ── Formatage / validation (client uniquement — aucune donnée bancaire n'est
// transmise à notre backend : la saisie finale sécurisée a lieu chez le
// fournisseur de paiement). ─────────────────────────────────────────────────
const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function StepPayment({ data, plan, onBack, onComplete }: Props) {
  const [method, setMethod] = useState<Method>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const router = useRouter();

  // Champs des formulaires (présentation réaliste — non transmis au backend).
  const [card, setCard] = useState({ holder: '', number: '', expiry: '', cvv: '' });
  const [mobile, setMobile] = useState({ operator: '', phone: '' });

  const price = plan?.monthlyPrice ?? 0;
  const symbol = currencySymbol(plan?.currency ?? data.currency ?? 'EUR');

  const cardValid =
    card.holder.trim().length > 1 &&
    card.number.replace(/\s/g, '').length >= 12 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    /^\d{3,4}$/.test(card.cvv);
  const mobileValid = !!mobile.operator && mobile.phone.replace(/\D/g, '').length >= 8;
  const canPay = method === 'card' ? cardValid : mobileValid;

  const registerAccount = async () => {
    const result = await onboardingService.register({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      restaurantName: data.restaurantName,
      slug: data.slug,
      country: data.country,
      currency: data.currency,
      timezone: data.timezone,
      cuisineType: data.cuisineType,
    });
    if (!result.success) throw new Error("L'inscription a échoué");
    setUser(result.user as any);
    if (result.tenant && typeof window !== 'undefined') {
      localStorage.setItem('tenantId', result.tenant.id);
      localStorage.setItem('tenantSlug', result.tenant.slug);
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: result.tenant.id,
          tenantSlug: result.tenant.slug,
        }),
      });
    }
    onComplete?.();
    return result;
  };

  const goToDashboard = () => {
    router.refresh();
    router.push('/admin/dashboard');
  };

  const handlePay = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1) Inscription (compte créé sur le plan gratuit — l'upgrade est appliqué
      //    par le webhook après paiement effectif).
      await registerAccount();

      // 2) Redirection vers le checkout sécurisé du fournisseur (la saisie
      //    bancaire finale a lieu chez le fournisseur).
      const checkout = await api.post('/billing/checkout', { plan: data.plan, method });
      if (checkout?.url) {
        window.location.href = checkout.url as string;
        return;
      }
      throw new Error('missing_checkout_url');
    } catch (err: any) {
      const msg =
        err?.message?.includes('configuré') || err?.message === 'missing_checkout_url'
          ? "Le paiement en ligne n'a pas pu démarrer (fournisseur non configuré). Votre compte est prêt sur le plan gratuit — vous pourrez souscrire depuis Facturation."
          : err?.message || 'Une erreur est survenue lors du paiement';
      setError(msg);
      setIsLoading(false);
    }
  };

  const labelCls = 'text-sm font-medium text-foreground';
  const inputCls =
    'h-11 rounded-xl bg-background border-border focus-visible:ring-primary/30 focus-visible:border-primary';

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
          Paiement
        </h1>
        <p className="text-sm text-muted-foreground">
          Finalisez votre abonnement {plan?.name} en toute sécurité.
        </p>
      </div>

      {/* Mise en page paysage : récap à gauche, moyen de paiement à droite. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* ── Colonne récapitulatif ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Forfait {plan?.name}</p>
                  <p className="text-xs text-muted-foreground">Facturation mensuelle · sans engagement</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-xl text-foreground tabular-nums">{price} {symbol}</p>
                <p className="text-[10px] text-muted-foreground">/ mois</p>
              </div>
            </div>
            {plan?.highlights?.length ? (
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 border-b border-border">
                {plan.highlights.slice(0, 6).map((h) => (
                  <div key={h} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 shrink-0 text-success" />
                    <span className="text-[11px] text-foreground/70">{h}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
              <span className="text-sm font-semibold text-foreground">Total aujourd&apos;hui</span>
              <span className="font-display text-2xl text-foreground tabular-nums">{price} {symbol}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 border border-border p-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              La saisie finale est effectuée sur la page de paiement sécurisée (chiffrée)
              de notre prestataire. Nous ne stockons jamais vos données de paiement.
            </p>
          </div>
        </div>

        {/* ── Colonne moyen de paiement ── */}
        <div className="space-y-4">
          <div>
            <p className={`${labelCls} mb-2`}>Moyen de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-foreground leading-tight">{m.label}</span>
                      <span className="block text-[10px] text-muted-foreground leading-tight truncate">{m.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={method}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {method === 'card' && (
                <>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Nom du titulaire</Label>
                    <Input
                      className={inputCls}
                      placeholder="Jean Dupont"
                      value={card.holder}
                      onChange={(e) => setCard({ ...card, holder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Numéro de carte</Label>
                    <div className="relative">
                      <Input
                        className={`${inputCls} pr-11 font-mono`}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      />
                      <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Expiration</Label>
                      <Input
                        className={`${inputCls} font-mono`}
                        placeholder="MM/AA"
                        inputMode="numeric"
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CVV</Label>
                      <Input
                        className={`${inputCls} font-mono`}
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      />
                    </div>
                  </div>
                </>
              )}

              {method === 'mobile' && (
                <>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Opérateur</Label>
                    <Select value={mobile.operator} onValueChange={(v) => setMobile({ ...mobile, operator: v })}>
                      <SelectTrigger className={`${inputCls} w-full`}>
                        <SelectValue placeholder="Choisir un opérateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOBILE_OPERATORS.map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Numéro de téléphone</Label>
                    <Input
                      className={inputCls}
                      placeholder="+225 07 00 00 00 00"
                      inputMode="tel"
                      value={mobile.phone}
                      onChange={(e) => setMobile({ ...mobile, phone: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Vous recevrez une demande de confirmation sur votre téléphone.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 rounded-xl bg-warning/10 border border-warning/20 px-4 py-3"
              role="alert"
            >
              <p className="text-xs text-foreground/80 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={goToDashboard}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Continuer vers mon tableau de bord →
              </button>
            </motion.div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="h-11 px-4 rounded-xl"
              aria-label="Étape précédente"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={handlePay}
              disabled={isLoading || !canPay}
              className="flex-1 h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Payer {price} {symbol}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
