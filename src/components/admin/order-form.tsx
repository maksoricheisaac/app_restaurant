"use client"

import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "../ui/label"

const orderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1),
  price: z.number().min(0),
})

const formSchema = z.object({
  customerId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  tableId: z.string().optional(),
  type: z.enum(["dine_in", "takeaway", "delivery"]).optional(),
  status: z.enum(["pending", "preparing", "ready", "served", "completed", "paid", "cancelled"]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
})

type FormValues = z.infer<typeof formSchema>

export default function OrderForm({
  defaultValues,
  onSubmit,
  tables = [],
  customers = [],
  menu = [],
}: {
  defaultValues?: Partial<FormValues>
  onSubmit: (values: FormValues) => void
  tables?: Array<{ id: string; number?: string | number }>
  customers?: Array<{ id: string; name?: string }>
  menu?: Array<{ id: string; name: string; price: number }>
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      name: "",
      email: "",
      phone: "",
      tableId: "",
      type: "dine_in",
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
      items: defaultValues?.items || [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const addMenuItem = (menuItem?: { id?: string; name: string; price: number }) => {
    append({ name: menuItem?.name || "Nouvel article", quantity: 1, price: menuItem?.price ?? 0 })
  }

  const total = (form.getValues("items") || []).reduce((acc, it) => acc + (it.quantity || 0) * (it.price || 0), 0)

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 bg-white rounded-md p-6 shadow-sm"
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-4">
          <h3 className="text-lg font-semibold text-orange-600">Informations client</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Client existant</Label>
              <Select defaultValue={form.register("customerId") as any} onValueChange={v => form.setValue("customerId", v as any)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Client existant" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Table</Label>
              <Select defaultValue={form.register("tableId") as any} onValueChange={v => form.setValue("tableId", v as any)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Nom du client</Label>
              <Input {...form.register("name") as any} placeholder="Nom complet" />
            </div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select defaultValue={form.getValues("type") as any} onValueChange={v => form.setValue("type", v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine_in">Sur place</SelectItem>
                  <SelectItem value="takeaway">À emporter</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Email</Label>
              <Input {...form.register("email") as any} placeholder="email@exemple.com" />
            </div>
            <div>
              <Label className="text-sm">Date</Label>
              <Input type="date" {...form.register("date") as any} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Téléphone</Label>
              <Input {...form.register("phone") as any} placeholder="06.12.34.56.78" />
            </div>
            <div>
              <Label className="text-sm">Heure</Label>
              <Input type="time" {...form.register("time") as any} />
            </div>
          </div>

          <div>
            <Label className="text-sm">Notes</Label>
            <Textarea {...form.register("notes") as any} placeholder="Instructions spéciales, allergies, etc." />
          </div>
        </div>

        <div className="col-span-5 space-y-4">
          <h3 className="text-lg font-semibold text-orange-600">Détails de la commande</h3>

          <div className="space-y-2">
            <label className="text-sm">Articles</label>

            <div className="space-y-3 max-h-64 overflow-auto">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
                  <div className="flex-1">
                    <Input {...form.register(`items.${idx}.name` as const) as any} />
                    <div className="flex gap-2 mt-2">
                      <Input type="number" {...form.register(`items.${idx}.quantity` as const, { valueAsNumber: true }) as any} className="w-24" />
                      <Input type="number" {...form.register(`items.${idx}.price` as const, { valueAsNumber: true }) as any} className="w-32" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-semibold">{((form.getValues(`items.${idx}.quantity`) || 0) * (form.getValues(`items.${idx}.price`) || 0)).toFixed(2)} €</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" type="button" onClick={() => remove(idx)}>Supprimer</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <Button type="button" onClick={() => addMenuItem()}>+ Ajouter article</Button>
              {menu.length > 0 && (
                <div className="flex gap-2">
                  {menu.slice(0, 6).map(m => (
                    <Button key={m.id} variant="secondary" size="sm" type="button" onClick={() => addMenuItem(m)}>
                      {m.name} ({m.price} €)
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-orange-600">Total:</div>
              <div className="text-2xl font-extrabold text-orange-600">{total.toFixed(2)} €</div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => form.reset()}>
                Réinitialiser
              </Button>
              <Button type="submit">Créer la commande</Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
