'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import api from '@/lib/api-client';
import { PLAN_BY_ID } from '@/config/plans';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  data: OnboardingData;
  onBack: () => void;
  /** Purge du brouillon localStorage une fois l'inscription réussie. */
  onComplete?: () => void;
}

/**
 * Étape Paiement — s'affiche dès qu'un plan payant est choisi.
 *
 * Le clic sur « Payer » est l'action de finalisation : c'est SEULEMENT ici que
 * le compte + le restaurant sont créés (transaction unique via `register`),
 * puis un checkout provider réel est ouvert et l'utilisateur est redirigé vers
 * le formulaire de paiement sécurisé. Tant qu'il n'a pas payé, rien n'est
 * persisté s'il abandonne avant ce clic.
 */
export default function StepPayment({ data, onBack, onComplete }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const router = useRouter();

  const plan = PLAN_BY_ID[data.plan];
  const price = plan?.monthlyPrice ?? 0;

  const handlePay = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1) Inscription complète (compte + restaurant) en une transaction.
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

      // 2) Session cohérente (owner + tenantId) pour autoriser le checkout.
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

      // 3) Checkout provider réel → redirection vers le formulaire de paiement.
      const checkout = await api.post('/billing/checkout', { plan: data.plan });
      if (checkout?.url) {
        window.location.href = checkout.url as string;
        return;
      }
      throw new Error('missing_checkout_url');
    } catch (err: any) {
      // Le compte est déjà créé (plan free) : on propose de continuer sans payer.
      const msg =
        err?.message?.includes('configuré') || err?.message === 'missing_checkout_url'
          ? "Le paiement n'a pas pu démarrer (fournisseur non configuré). Votre compte est prêt sur le plan gratuit — vous pourrez souscrire au plan Pro depuis Facturation."
          : err?.message || 'Une erreur est survenue lors du paiement';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paiement
        </h1>
        <p className="text-sm text-slate-500">
          Finalisez votre abonnement {plan?.name} en toute sécurité.
        </p>
      </div>

      {/* Récapitulatif de commande */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Forfait {plan?.name}</p>
              <p className="text-xs text-slate-400">Facturation mensuelle · sans engagement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{price} €</p>
            <p className="text-[10px] text-slate-400">/ mois</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">Total aujourd&apos;hui</span>
          <span className="text-lg font-black text-slate-900">{price} €</span>
        </div>
      </div>

      {/* Encart sécurité */}
      <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Vous saisirez vos informations de carte sur la page de paiement sécurisée
          (chiffrée). Nous ne stockons jamais vos données bancaires.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-3"
        >
          <p className="text-xs text-amber-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              router.refresh();
              router.push('/admin/dashboard');
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Continuer vers mon tableau de bord →
          </button>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={handlePay}
          disabled={isLoading}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Payer {price} € et démarrer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
