"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import { getAllIngredients } from "@/actions/admin/inventory-actions";
import type { StockMovementFormData } from "@/types/inventory";

const stockMovementFormSchema = z.object({
  ingredientId: z.string().min(1, "L'ingrédient est requis"),
  type: z.enum(["IN", "OUT", "ADJUST"], {
    required_error: "Le type de mouvement est requis",
  }),
  quantity: z.number().positive("La quantité doit être positive"),
  description: z.string().optional(),
});

interface StockMovementFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockMovementFormData) => void;
  isLoading: boolean;
}

export function StockMovementForm({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
}: StockMovementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      ingredientId: "",
      type: "IN",
      quantity: 0,
      description: "",
    },
  });

  // Récupération des ingrédients
  const { data: ingredientsData } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const result = await getAllIngredients({ page: 1, perPage: 100 });
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des ingrédients");
      }
      return result.data;
    },
  });

  const handleSubmit = async (data: StockMovementFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const ingredients = ingredientsData?.data?.ingredients || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau mouvement de stock</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ingredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingrédient *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un ingrédient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ingredients
                        .filter((ingredient) => ingredient.isActive)
                        .map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} - Stock: {ingredient.stock} {ingredient.unit}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de mouvement *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IN">Entrée de stock</SelectItem>
                      <SelectItem value="OUT">Sortie de stock</SelectItem>
                      <SelectItem value="ADJUST">Ajustement de stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description du mouvement (optionnel)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {(isLoading || isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Créer le mouvement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
