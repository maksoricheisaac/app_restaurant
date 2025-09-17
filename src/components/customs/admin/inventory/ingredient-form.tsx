"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

import type { Ingredient, IngredientFormData } from "@/types/inventory";

const ingredientFormSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient est requis"),
  unit: z.string().min(1, "L'unité est requise"),
  price: z.number().positive("Le prix doit être positif"),
  stock: z.number().min(0, "Le stock ne peut pas être négatif"),
  minStock: z.number().min(0, "Le stock minimum ne peut pas être négatif").optional(),
  supplier: z.string().optional(),
  isActive: z.boolean().default(true),
});

interface IngredientFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIngredient?: Ingredient | null;
  onSubmit: (data: IngredientFormData) => void;
  isLoading: boolean;
}

export function IngredientForm({
  isOpen,
  onOpenChange,
  selectedIngredient,
  onSubmit,
  isLoading,
}: IngredientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      unit: "",
      price: 0,
      stock: 0,
      minStock: undefined,
      supplier: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (selectedIngredient) {
      form.reset({
        name: selectedIngredient.name,
        unit: selectedIngredient.unit,
        price: selectedIngredient.price,
        stock: selectedIngredient.stock,
        minStock: selectedIngredient.minStock || undefined,
        supplier: selectedIngredient.supplier || "",
        isActive: selectedIngredient.isActive,
      });
    } else {
      form.reset({
        name: "",
        unit: "",
        price: 0,
        stock: 0,
        minStock: undefined,
        supplier: "",
        isActive: true,
      });
    }
  }, [selectedIngredient, form]);

  const handleSubmit = async (data: IngredientFormData) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {selectedIngredient ? "Modifier l'ingrédient" : "Nouvel ingrédient"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'ingrédient *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tomates" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: kg, L, pièce" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (FCFA) *</FormLabel>
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
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock actuel *</FormLabel>
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
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fournisseur ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ingrédient actif</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      L'ingrédient est disponible pour les recettes
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {selectedIngredient ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
