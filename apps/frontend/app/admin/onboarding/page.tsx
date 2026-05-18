"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Store,
  UtensilsCrossed,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "flash_menu_onboarding_done";

const step1Schema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  address: z.string().min(5, "Adresse trop courte"),
});

const step2Schema = z.object({
  categoryName: z.string().min(2, "Nom de catégorie requis"),
  itemName: z.string().min(2, "Nom du plat requis"),
  itemPrice: z.coerce.number().positive("Prix invalide"),
});

const STEPS = [
  { id: 1, label: "Restaurant", icon: Store },
  { id: 2, label: "Premier plat", icon: UtensilsCrossed },
  { id: 3, label: "Lancement", icon: Rocket },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { phone: "", address: "" },
  });

  const form2 = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      categoryName: "Plats principaux",
      itemName: "",
      itemPrice: 0,
    },
  });

  async function handleStep1(values: z.infer<typeof step1Schema>) {
    setIsLoading(true);
    try {
      await api.patch("/settings", values);
      setStep(2);
    } catch {
      toast.error("Erreur lors de la sauvegarde, veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStep2(values: z.infer<typeof step2Schema>) {
    setIsLoading(true);
    try {
      const cat = await api.post("/categories", { name: values.categoryName });
      await api.post("/menu", {
        name: values.itemName,
        price: values.itemPrice,
        categoryId: cat.id,
        available: true,
      });
      setStep(3);
    } catch {
      toast.error("Erreur lors de la création du plat, veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFinish() {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    router.push("/admin/dashboard");
  }

  function handleSkip() {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200 mb-2">
            <Rocket className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Configurez votre restaurant
          </h1>
          <p className="text-slate-500">
            3 étapes simples pour être opérationnel en moins de 2 minutes.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      done
                        ? "border-orange-500 bg-orange-500 text-white"
                        : active
                          ? "border-orange-500 bg-white text-orange-500"
                          : "border-muted bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-orange-600" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-3 mb-5 h-0.5 w-16 transition-all",
                      step > s.id ? "bg-orange-400" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold">Informations de contact</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ces informations seront affichées à vos clients.
                </p>
              </div>
              <Form {...form1}>
                <form
                  onSubmit={form1.handleSubmit(handleStep1)}
                  className="space-y-4"
                >
                  <FormField
                    control={form1.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="+237 6XX XXX XXX"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="123 Rue du Commerce, Yaoundé"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                    >
                      Passer cette étape
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Continuer
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold">Votre premier plat</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez une catégorie et ajoutez votre premier plat. Vous pourrez en ajouter d'autres depuis le menu.
                </p>
              </div>
              <Form {...form2}>
                <form
                  onSubmit={form2.handleSubmit(handleStep2)}
                  className="space-y-4"
                >
                  <FormField
                    control={form2.control}
                    name="categoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ex: Plats principaux"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du plat</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Poulet DG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
                    name="itemPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="ex: 3500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Retour
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSkip}
                      >
                        Passer
                      </Button>
                      <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Créer et continuer
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Votre restaurant est prêt ! 🎉
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Votre espace Flash Menu est configuré. Commencez à prendre
                    des commandes dès maintenant.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => router.push("/admin/menu")}
                >
                  <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-sm">Enrichir le menu</span>
                  <span className="text-xs text-muted-foreground">
                    Ajoutez plus de plats
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => router.push("/admin/tables")}
                >
                  <Store className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-sm">Configurer les tables</span>
                  <span className="text-xs text-muted-foreground">
                    Générez vos QR codes
                  </span>
                </Button>
              </div>

              <Button onClick={handleFinish} className="w-full h-12 text-base font-bold gap-2">
                <Rocket className="h-5 w-5" />
                Accéder au tableau de bord
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
