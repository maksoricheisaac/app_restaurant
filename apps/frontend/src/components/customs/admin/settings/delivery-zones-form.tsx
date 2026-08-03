"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
} from "@/hooks/api/useRestaurant";

const zoneSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  isActive: z.boolean(),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

type DeliveryZone = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

function ZoneDialog({
  open,
  onOpenChange,
  zone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zone: DeliveryZone | null;
}) {
  const createMutation = useCreateDeliveryZone();
  const updateMutation = useUpdateDeliveryZone();
  const isEditing = !!zone;

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: zone?.name ?? "",
      price: zone?.price ?? 0,
      isActive: zone?.isActive ?? true,
    },
  });

  const onSubmit = async (values: ZoneFormValues) => {
    try {
      if (isEditing && zone) {
        await updateMutation.mutateAsync({ id: zone.id, data: values });
        toast.success("Zone mise à jour");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Zone créée");
      }
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier" : "Ajouter"} une zone de livraison
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la zone</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Centre-ville" {...field} />
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
                  <FormLabel>Prix de livraison (FCFA)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Zone active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                Sauvegarder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeliveryZonesForm() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const { data: zonesData, isLoading } = useDeliveryZones();
  const deleteMutation = useDeleteDeliveryZone();

  const zones: DeliveryZone[] = (zonesData as any) ?? [];

  const openAdd = () => {
    setEditingZone(null);
    setDialogOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Zone supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Zones de livraison</CardTitle>
            <CardDescription>
              Gérez les zones où vous effectuez des livraisons.
            </CardDescription>
          </div>
          <Button onClick={openAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une zone
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Chargement…
            </p>
          ) : zones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucune zone de livraison configurée.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>{zone.price.toFixed(0)} FCFA</TableCell>
                    <TableCell>
                      <Badge
                        variant={zone.isActive ? "default" : "secondary"}
                      >
                        {zone.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer la zone ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. La zone «{" "}
                              {zone.name} » sera supprimée définitivement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(zone.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ZoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zone={editingZone}
      />
    </>
  );
}
