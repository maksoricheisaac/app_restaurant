"use client";

import { useState } from "react";
import { Check, Zap, Crown, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/usePlan";
import { usePlanCatalog } from "@/hooks/api/usePlans";
import { currencySymbol } from "@/config/plans";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const { plan: currentPlan } = usePlan();
  const { plans: catalog, isLoading: plansLoading } = usePlanCatalog();
  const [loading, setLoading] = useState<string | null>(null);

  // Ordre d'un plan (par prix) pour distinguer upgrade / downgrade.
  const priceOf = (key: string) =>
    catalog?.find((p) => p.key === key)?.monthlyPrice ?? 0;
  const PLANS = catalog ?? [];

  async function handleUpgrade(planId: string) {
    setLoading(planId);
    try {
      const res = await api.post("/billing/checkout", { plan: planId });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error("Impossible d'initialiser le paiement");
      }
    } catch {
      toast.error("Erreur lors de la connexion au service de paiement");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Abonnement</h1>
        <p className="text-muted-foreground mt-1">
          Plan actuel :{" "}
          <span className="font-bold capitalize text-orange-600">{currentPlan}</span>
        </p>
      </div>

      {/* Current plan highlight */}
      {currentPlan !== "free" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Vous êtes sur le plan <strong className="capitalize">{currentPlan}</strong>. Toutes vos fonctionnalités sont actives.
          </p>
        </div>
      )}

      {plansLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500/50" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isPaid = plan.monthlyPrice > 0;
          // Upgrade = plan payant, plus cher que l'actuel, et souscriptible.
          const isUpgrade =
            !isCurrent && !plan.comingSoon && isPaid &&
            plan.monthlyPrice > priceOf(currentPlan);

          return (
            <Card
              key={plan.key}
              className={cn(
                "relative flex flex-col transition-all",
                isCurrent && "border-orange-400 ring-1 ring-orange-400",
                plan.badge && "shadow-lg",
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-3 shadow">{plan.badge}</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="border-orange-400 text-orange-600 bg-white">
                    Plan actuel
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  {plan.key === "pro" && <Zap className="h-5 w-5 text-orange-500" />}
                  {plan.key === "enterprise" && <Crown className="h-5 w-5 text-purple-500" />}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description ?? plan.tagline}</p>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black">{plan.monthlyPrice}{currencySymbol(plan.currency)}</span>
                  <span className="text-muted-foreground text-sm">/ mois</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <ul className="space-y-2.5 flex-1">
                  {plan.highlights.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "w-full mt-2",
                    isCurrent && "bg-slate-100 text-slate-500 hover:bg-slate-100 cursor-default",
                    isUpgrade && "gap-2",
                  )}
                  variant={plan.key === "pro" && !isCurrent ? "default" : "outline"}
                  disabled={isCurrent || plan.comingSoon || !isUpgrade || loading !== null}
                  onClick={() => isUpgrade && handleUpgrade(plan.key)}
                >
                  {loading === plan.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Actif</>
                  ) : plan.comingSoon ? (
                    "Bientôt disponible"
                  ) : isUpgrade ? (
                    <>Passer à {plan.name} <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    "Indisponible"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé · Annulation à tout moment · Sans engagement
      </p>
    </div>
  );
}
