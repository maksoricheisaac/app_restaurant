"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getRestaurantSettings, updateSocialLinks } from "@/actions/admin/settings-actions";
import { SocialLinksSchema } from "@/schemas/admin-schemas";

export function SocialLinksForm() {
  const form = useForm<z.infer<typeof SocialLinksSchema>>({
    resolver: zodResolver(SocialLinksSchema),
    defaultValues: {
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
    },
  });

  useEffect(() => {
    async function loadLinks() {
      try {
        const settings = await getRestaurantSettings();
        form.reset({
          facebookUrl: settings.facebookUrl || "",
          instagramUrl: settings.instagramUrl || "",
          twitterUrl: settings.twitterUrl || "",
          linkedinUrl: settings.linkedinUrl || "",
          youtubeUrl: settings.youtubeUrl || "",
          tiktokUrl: settings.tiktokUrl || "",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de chargement.");
      }
    }
    loadLinks();
  }, [form]);

  async function onSubmit(values: z.infer<typeof SocialLinksSchema>) {
    const result = await updateSocialLinks(values);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Réseaux Sociaux</CardTitle>
        <CardDescription>
          Ajoutez les liens vers les profils sociaux de votre restaurant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter / X</FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/company/votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/c/votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tiktokUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input placeholder="https://tiktok.com/@votrerestaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Sauvegarder les liens
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
