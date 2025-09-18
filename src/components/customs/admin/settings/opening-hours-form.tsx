"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getOpeningHours, updateOpeningHours, getExceptionalClosures, addExceptionalClosure, deleteExceptionalClosure } from "@/actions/admin/settings-actions";
import { OpeningHourSchema } from "@/schemas/admin-schemas";
import { OpeningHours as OpeningHoursType, ExceptionalClosure as ExceptionalClosureType } from "@/generated/prisma";

const FormSchema = z.object({
  openingHours: z.array(OpeningHourSchema),
});

const daysOfWeekFrench: { [key: string]: string } = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

// Ordre chronologique des jours de la semaine
const daysOrder = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export function OpeningHoursForm() {
  const [closures, setClosures] = useState<ExceptionalClosureType[]>([]);
  const [newClosureDate, setNewClosureDate] = useState<Date | undefined>();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { openingHours: [] },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "openingHours",
  });

  // Fonction pour trier les horaires selon l'ordre des jours
  const sortHoursByDayOrder = (hours: OpeningHoursType[]) => {
    return hours.sort((a, b) => {
      const indexA = daysOrder.indexOf(a.dayOfWeek.toLowerCase());
      const indexB = daysOrder.indexOf(b.dayOfWeek.toLowerCase());
      return indexA - indexB;
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [hoursData, closuresData] = await Promise.all([
          getOpeningHours(),
          getExceptionalClosures(),
        ]);
        
        // Trier les horaires avant de les affecter
        const sortedHours = sortHoursByDayOrder(hoursData);
        replace(sortedHours);
        setClosures(closuresData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de chargement.");
      }
    }
    loadData();
  }, [replace]);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const result = await updateOpeningHours(values.openingHours);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  async function handleAddClosure() {
    if (!newClosureDate) return;
    const result = await addExceptionalClosure({ date: newClosureDate });
    if (result.success) {
      toast.success(result.message);
      setNewClosureDate(undefined);
      const updatedClosures = await getExceptionalClosures();
      setClosures(updatedClosures);
    } else {
      toast.error(result.message);
    }
  }

  async function handleDeleteClosure(id: string) {
    const result = await deleteExceptionalClosure(id);
    if (result.success) {
      toast.success(result.message);
      const updatedClosures = await getExceptionalClosures();
      setClosures(updatedClosures);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Horaires d&#39;ouverture</CardTitle>
            <CardDescription>Définissez les heures d&#39;ouverture pour chaque jour.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium capitalize min-w-[100px]">
                      {daysOfWeekFrench[field.dayOfWeek.toLowerCase()]}
                    </span>
                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`openingHours.${index}.openTime`}
                        render={({ field }) => (
                          <Input 
                            type="time" 
                            {...field} 
                            disabled={form.watch(`openingHours.${index}.isClosed`)}
                            className="w-24"
                          />
                        )}
                      />
                      <span className="text-muted-foreground">-</span>
                      <FormField
                        control={form.control}
                        name={`openingHours.${index}.closeTime`}
                        render={({ field }) => (
                          <Input 
                            type="time" 
                            {...field} 
                            disabled={form.watch(`openingHours.${index}.isClosed`)}
                            className="w-24"
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`openingHours.${index}.isClosed`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-sm">Fermé</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder les horaires"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Fermetures exceptionnelles</CardTitle>
            <CardDescription>Ajoutez des jours de fermeture spécifiques.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newClosureDate ? format(newClosureDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={newClosureDate} 
                    onSelect={setNewClosureDate} 
                    initialFocus 
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleAddClosure} disabled={!newClosureDate}>
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {closures.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune fermeture exceptionnelle</p>
              ) : (
                closures
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(closure => (
                    <div key={closure.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div>
                        <span className="font-medium">
                          {format(new Date(closure.date), 'PPP', { locale: fr })}
                        </span>
                        {closure.reason && (
                          <p className="text-xs text-muted-foreground">{closure.reason}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClosure(closure.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}