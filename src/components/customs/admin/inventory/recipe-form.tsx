"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import { getAllIngredients } from "@/actions/admin/inventory-actions";
import { getAllMenuItems } from "@/actions/admin/menu-actions";
import type { Recipe, RecipeFormData } from "@/types/inventory";

const recipeFormSchema = z.object({
  menuItemId: z.string().min(1, "L'élément du menu est requis"),
  ingredientId: z.string().min(1, "L'ingrédient est requis"),
  quantity: z.number().positive("La quantité doit être positive"),
});

interface RecipeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRecipe?: Recipe | null;
  onSubmit: (data: RecipeFormData) => void;
  isLoading: boolean;
}

export function RecipeForm({
  isOpen,
  onOpenChange,
  selectedRecipe,
  onSubmit,
  isLoading,
}: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      menuItemId: "",
      ingredientId: "",
      quantity: 0,
    },
  });

  // Récupération des éléments du menu
  const { data: menuData } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const result = await getAllMenuItems({ page: 1, perPage: 100 });
      if (!result.data) {
        throw new Error("Erreur lors de la récupération du menu");
      }
      return result.data;
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

  useEffect(() => {
    if (selectedRecipe) {
      form.reset({
        menuItemId: selectedRecipe.menuItemId,
        ingredientId: selectedRecipe.ingredientId,
        quantity: selectedRecipe.quantity,
      });
    } else {
      form.reset({
        menuItemId: "",
        ingredientId: "",
        quantity: 0,
      });
    }
  }, [selectedRecipe, form]);

  const handleSubmit = async (data: RecipeFormData) => {
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

  const menuItems = menuData?.data?.items || [];
  const ingredients = ingredientsData?.data?.ingredients || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedRecipe ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="menuItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plat du menu *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir un plat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.category.name}
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
              name="ingredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingrédient *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir un ingrédient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ingredients
                        .filter((ingredient) => ingredient.isActive)
                        .map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {(isLoading || isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedRecipe ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
