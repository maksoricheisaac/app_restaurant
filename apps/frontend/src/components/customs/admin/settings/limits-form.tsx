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
import { useLimits, useUpdateLimits } from "@/hooks/api/useSettings";
import { OrderLimitsSchema } from "@/schemas/admin-schemas";

export function LimitsForm() {
  const form = useForm<z.infer<typeof OrderLimitsSchema>>({
    resolver: zodResolver(OrderLimitsSchema),
    defaultValues: {
      maxOrdersPerHour: 0,
      maxOrdersPerUserHour: 0,
    },
  });

  const { data: limitsData } = useLimits();
  const updateMutation = useUpdateLimits();

  useEffect(() => {
    if (limitsData) {
      form.reset(limitsData);
    }
  }, [limitsData, form]);

  const onSubmit = async (data: z.infer<typeof OrderLimitsSchema>) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Limites mises à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Limitations de commandes</CardTitle>
        <CardDescription>
          Définissez le nombre maximum de commandes que vous pouvez gérer par heure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="maxOrdersPerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite globale de commandes par heure</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxOrdersPerUserHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite de commandes par client par heure</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Sauvegarder les limitations
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
