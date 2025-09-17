"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { getDeliveryZones, upsertDeliveryZone, deleteDeliveryZone } from "@/actions/admin/settings-actions";
import { DeliveryZoneSchema } from "@/schemas/admin-schemas";
import { DeliveryZone } from "@/generated/prisma";

export function DeliveryZonesForm() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const form = useForm<z.infer<typeof DeliveryZoneSchema>>({
    resolver: zodResolver(DeliveryZoneSchema),
    defaultValues: { name: "", price: 0, isActive: true },
  });

  async function loadZones() {
    try {
      const zonesData = await getDeliveryZones();
      setZones(zonesData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de chargement.");
    }
  }

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (editingZone) {
      form.reset(editingZone);
    } else {
      form.reset({ name: "", price: 0, isActive: true });
    }
  }, [editingZone, form]);

  async function onSubmit(values: z.infer<typeof DeliveryZoneSchema>) {
    const result = await upsertDeliveryZone({ ...values, id: editingZone?.id });
    if (result.success) {
      toast.success(result.message);
      loadZones();
      setIsDialogOpen(false);
      setEditingZone(null);
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteDeliveryZone(id);
    if (result.success) {
      toast.success(result.message);
      loadZones();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Zones de livraison</CardTitle>
          <CardDescription>Gérez les zones où vous effectuez des livraisons.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingZone(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingZone ? "Modifier" : "Ajouter"} une zone de livraison</DialogTitle>
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
                        <Input {...field} />
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
                        <Input type="number" step="0.01" {...field} />
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
                      <FormLabel>Activer la zone</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>Sauvegarder</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
                <TableCell>{zone.name}</TableCell>
                <TableCell>{zone.price.toFixed(2)} FCFA</TableCell>
                <TableCell>{zone.isActive ? "Actif" : "Inactif"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingZone(zone); setIsDialogOpen(true); }}>
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
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible et supprimera définitivement la zone de livraison.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(zone.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
