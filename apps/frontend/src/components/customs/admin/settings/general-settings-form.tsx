"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Globe, UtensilsCrossed, AlignLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useRestaurant, useUpdateRestaurantIdentity } from "@/hooks/api/useRestaurant";
import { GeneralSettingsSchema } from "@/schemas/admin-schemas";
import { RestaurantInfoCard } from "./restaurant-info-card";

type FormValues = z.infer<typeof GeneralSettingsSchema>;

export function GeneralSettingsForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: {
      name:            "",
      description:     "",
      phone:           "",
      email:           "",
      address:         "",
      website:         "",
      deliveryEnabled: false,
      takeawayEnabled: false,
      dineInEnabled:   false,
    },
  });

  const { data: restaurant, isLoading } = useRestaurant();
  const updateMutation = useUpdateRestaurantIdentity();

  useEffect(() => {
    if (restaurant) {
      form.reset({
        name:            (restaurant as any).name            ?? "",
        description:     (restaurant as any).description     ?? "",
        phone:           (restaurant as any).phone           ?? "",
        email:           (restaurant as any).email           ?? "",
        address:         (restaurant as any).address         ?? "",
        website:         (restaurant as any).website         ?? "",
        deliveryEnabled: (restaurant as any).deliveryEnabled ?? false,
        takeawayEnabled: (restaurant as any).takeawayEnabled ?? false,
        dineInEnabled:   (restaurant as any).dineInEnabled   ?? false,
      });
    }
  }, [restaurant, form]);

  async function onSubmit(data: FormValues) {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Paramètres mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="space-y-6">

      {/* Lien menu public */}
      <RestaurantInfoCard />

      <Card>
        <CardHeader>
          <CardTitle>Informations du restaurant</CardTitle>
          <CardDescription>
            Ces informations s&apos;affichent dans le footer de votre menu client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Identité ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                        Nom du restaurant
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex : Le Gourmet Africain" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlignLeft className="h-4 w-4 text-orange-500" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre restaurant en quelques phrases (style de cuisine, ambiance, spécialités…)"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Affiché dans le hero et le footer du menu client.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Contacts ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Coordonnées de contact</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-orange-500" />
                          Téléphone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+242 06 000 00 00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-orange-500" />
                          Email de contact
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@monresto.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                        Adresse
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Quartier, Avenue, Ville, Pays" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-orange-500" />
                        Site web
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.monresto.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Services ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Services disponibles</h3>

                <FormField
                  control={form.control}
                  name="dineInEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border bg-slate-50/50 px-4 py-3">
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer">Sur place</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Commandes en salle / dine-in</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="takeawayEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border bg-slate-50/50 px-4 py-3">
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer">À emporter</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Commandes à emporter</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border bg-slate-50/50 px-4 py-3">
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer">Livraison</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Livraison à domicile</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sauvegarde en cours…" : "Sauvegarder les modifications"}
              </Button>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
