'use client';

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageUpload from "@/components/image-upload";
import { toast } from "sonner";
import { useUploadMenuItemImage } from "@/hooks/api/useMedia";
import { MenuOptionsEditor } from "./menu-options-editor";

interface Category {
  id: string;
  name: string;
}

const menuItemSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  image: z.string().nullable().optional(),
  available: z.boolean(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    image: string | null;
    available: boolean;
  } | null;
  categories: Category[];
  onSubmit: (values: MenuItemFormData, pendingImageFile?: File | null) => void;
  isLoading: boolean;
}

export function MenuForm({
  isOpen,
  onOpenChange,
  selectedItem,
  categories,
  onSubmit,
  isLoading,
}: MenuFormProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    selectedItem?.image || null
  );
  // Stores a file selected in CREATE mode — uploaded after item creation
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const uploadMenuItemImage = useUploadMenuItemImage();
  const isUploading = uploadMenuItemImage.isPending;

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      image: null,
      available: true,
    },
  });

  useEffect(() => {
    if (selectedItem) {
      form.reset({
        name: selectedItem.name,
        description: selectedItem.description,
        price: selectedItem.price,
        categoryId: selectedItem.categoryId,
        image: selectedItem.image,
        available: selectedItem.available,
      });
      setUploadedImageUrl(selectedItem.image);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        image: null,
        available: true,
      });
      setUploadedImageUrl(null);
    }
    setPendingImageFile(null);
  }, [selectedItem, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        image: null,
        available: true,
      });
      setUploadedImageUrl(null);
      setPendingImageFile(null);
    }
  }, [isOpen, form]);

  const handleImageUpload = (file: File) => {
    if (selectedItem) {
      // EDIT mode: upload immediately to NestJS — item ID is known
      uploadMenuItemImage.mutate(
        { menuItemId: selectedItem.id, file },
        {
          onSuccess: (data) => {
            setUploadedImageUrl(data.url);
            form.setValue('image', data.url);
            toast.success('Image mise à jour');
          },
          onError: () => {
            toast.error("Erreur lors de l'upload de l'image");
          },
        }
      );
    } else {
      // CREATE mode: defer upload until after item creation (no ID yet)
      setPendingImageFile(file);
    }
  };

  const handleFormSubmit = (values: MenuItemFormData) => {
    onSubmit(values, pendingImageFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedItem ? "Modifier le plat" : "Ajouter un plat"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-8 px-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom du plat" />
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
                          {...field}
                          placeholder="Description du plat"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-row gap-4 w-full">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="w-full flex-1">
                        <FormLabel>Prix (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            step={50}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem className="w-full flex-1">
                        <FormLabel>Catégorie</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>Image du plat</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {uploadedImageUrl && !isUploading && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <strong>Image actuelle :</strong> Une image est déjà associée à ce plat.
                                Vous pouvez la remplacer en glissant une nouvelle image ou en cliquant pour en sélectionner une.
                              </p>
                            </div>
                          )}
                          {pendingImageFile && !selectedItem && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-700">
                                <strong>Image sélectionnée :</strong> Elle sera uploadée automatiquement après la création du plat.
                              </p>
                            </div>
                          )}
                          <ImageUpload
                            onImageUpload={handleImageUpload}
                            onImageRemove={() => {
                              setUploadedImageUrl(null);
                              setPendingImageFile(null);
                              form.setValue('image', null);
                            }}
                            currentImageUrl={uploadedImageUrl}
                            isUploading={isUploading}
                            disabled={isUploading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Formats acceptés : JPEG, PNG, WebP. Taille maximale : 5 Mo.
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Disponibilité</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Ce plat est-il disponible à la commande ?
                        </p>
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

                {/* Options / suppléments — disponible seulement en édition,
                    car les groupes doivent être rattachés à un plat existant. */}
                {selectedItem ? (
                  <MenuOptionsEditor menuItemId={selectedItem.id} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Enregistrez d&apos;abord le plat pour lui ajouter des
                    options et suppléments.
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="pt-6 border-t">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isUploading}
              >
                {isUploading
                  ? "Upload image en cours…"
                  : selectedItem
                  ? "Mettre à jour"
                  : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
