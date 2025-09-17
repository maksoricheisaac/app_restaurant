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
  isAvailable: z.boolean(),
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
    isAvailable: boolean;
  } | null;
  categories: Category[];
  onSubmit: (values: MenuItemFormData) => void;
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
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      image: null,
      isAvailable: true,
    },
  });

  // Mettre à jour les valeurs du formulaire quand selectedItem change
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        name: selectedItem.name,
        description: selectedItem.description,
        price: selectedItem.price,
        categoryId: selectedItem.categoryId,
        image: selectedItem.image,
        isAvailable: selectedItem.isAvailable,
      });
      setUploadedImageUrl(selectedItem.image);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        image: null,
        isAvailable: true,
      });
      setUploadedImageUrl(null);
    }
  }, [selectedItem, form]);

  // Réinitialiser le formulaire quand il se ferme
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        image: null,
        isAvailable: true,
      });
      setUploadedImageUrl(null);
    }
  }, [isOpen, form]);

  // Fonction pour uploader l'image
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/upload?filename=${file.name}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const blob = await response.json();
      setUploadedImageUrl(blob.url);
      form.setValue('image', blob.url);
      toast.success('Image uploadée avec succès');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setIsUploading(false);
    }
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                          <ImageUpload 
                            onImageUpload={handleImageUpload}
                            onImageRemove={() => {
                              setUploadedImageUrl(null);
                              form.setValue('image', null);
                            }}
                            currentImageUrl={uploadedImageUrl}
                          />
                          {isUploading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                              Upload en cours...
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Formats acceptés : JPG, PNG, GIF. Taille maximale : 5MB.
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isAvailable"
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
              </div>
            </ScrollArea>
            
            <div className="pt-6 border-t">
              <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
                {selectedItem ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 