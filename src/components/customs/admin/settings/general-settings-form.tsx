"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getRestaurantSettings, updateGeneralSettings } from "@/actions/admin/settings-actions";
import { GeneralSettingsSchema } from "@/schemas/admin-schemas";
import { useEffect } from "react";

export function GeneralSettingsForm() {
  const form = useForm<z.infer<typeof GeneralSettingsSchema>>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: {
      name: "",
      deliveryEnabled: false,
      takeawayEnabled: false,
      dineInEnabled: false,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getRestaurantSettings();
        form.reset(settings);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors du chargement des paramètres.");
      }
    }
    loadSettings();
  }, [form]);

  async function onSubmit(values: z.infer<typeof GeneralSettingsSchema>) {
    const result = await updateGeneralSettings(values);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Généraux</CardTitle>
        <CardDescription>Gérez les informations de base de votre restaurant.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du restaurant</FormLabel>
                  <FormControl>
                    <Input placeholder="Le nom de votre restaurant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Services disponibles</h3>
              <FormField
                control={form.control}
                name="dineInEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Service sur place</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Vente à emporter</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Livraison</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
