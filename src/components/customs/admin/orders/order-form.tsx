"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, ShoppingCart, FileText } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
type OrderType = "dine_in" | "takeaway" | "delivery";

type MenuItem = { id: string; name: string; description?: string | null; price: number; image?: string | null; categoryId: string };
type Category = { id: string; name: string };
type Customer = { id: string; name?: string | null; email?: string | null };
type Table = { id: string; number: number; seats: number };

type OrderItemForm = { name: string; quantity: number; price: number; image?: string };
type OrderFormValues = {
  customerId?: string;
  tableId: string | null;
  type: OrderType;
  status: OrderStatus;
  email?: string;
  phone?: string;
  date: Date;
  time: string;
  notes?: string;
  items: OrderItemForm[];
  total: number;
};

export function OrderForm({
  form,
  onSubmit,
  selectedOrder,
  customers,
  tables,
  menuItems,
  categories,
}: {
  form: UseFormReturn<OrderFormValues>;
  onSubmit: (values: OrderFormValues) => Promise<void> | void;
  selectedOrder: unknown | null;
  customers: Customer[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const items = (form.watch("items") as OrderItemForm[]) || [];

  const filteredMenu = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menuItems.filter((m) => {
      if (activeCategory && m.categoryId !== activeCategory) return false;
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        (m.description || "").toLowerCase().includes(term)
      );
    });
  }, [menuItems, search, activeCategory]);

  const addItem = (m: MenuItem) => {
    const existingIndex = items.findIndex((it) => it.name === m.name && it.price === m.price);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
      form.setValue("items", updated, { shouldDirty: true });
      toast.success(`Quantité de "${m.name}" augmentée`, {
        description: `Quantité actuelle: ${updated[existingIndex].quantity}`,
        duration: 2000,
      });
    } else {
      form.setValue("items", [...items, { name: m.name, quantity: 1, price: m.price, image: m.image || undefined }], { shouldDirty: true });
      toast.success(`"${m.name}" ajouté au panier`, {
        description: `${formatCurrency(m.price)} • Quantité: 1`,
        duration: 2000,
      });
    }
    computeTotal();
  };

  const inc = (index: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: updated[index].quantity + 1 };
    form.setValue("items", updated, { shouldDirty: true });
    computeTotal();
  };

  const dec = (index: number) => {
    const updated = [...items];
    const qty = Math.max(0, updated[index].quantity - 1);
    if (qty === 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], quantity: qty };
    }
    form.setValue("items", updated, { shouldDirty: true });
    computeTotal();
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    form.setValue("items", updated, { shouldDirty: true });
    computeTotal();
  };

  const computeTotal = () => {
    const list = (form.getValues("items") as OrderItemForm[]) || [];
    const total = list.reduce((acc: number, it: OrderItemForm) => acc + (it.quantity || 0) * (it.price || 0), 0);
    form.setValue("total", total, { shouldDirty: true });
  };

  const statusBadge = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-indigo-500",
      served: "bg-orange-500",
      cancelled: "bg-red-500",
    };
    return map[s];
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(amount);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 bg-gradient-to-b from-white to-[#FFF7F3] p-1"
    >
      <Tabs defaultValue="details" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#FFE5D9] h-auto">
          <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white py-3 px-4">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Détails</span>
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white py-3 px-4">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white py-3 px-4">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Résumé</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#FF6B35] mb-4">Informations de la commande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600">Client</label>
                <Select onValueChange={(v) => form.setValue("customerId", v)} value={form.watch("customerId") || ""}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.email || c.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Table</label>
                <Select onValueChange={(v) => form.setValue("tableId", v)} value={(form.watch("tableId") as string) || ""}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>Table {t.number} • {t.seats} places</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <Select onValueChange={(v: OrderType) => form.setValue("type", v)} value={form.watch("type")}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Sur place</SelectItem>
                    <SelectItem value="takeaway">À emporter</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Statut</label>
                <Select onValueChange={(v: OrderStatus) => form.setValue("status", v)} value={form.watch("status")}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["pending","preparing","ready","served","cancelled"] as OrderStatus[]).map(s => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("h-5", statusBadge(s))}></Badge>
                          <span className="capitalize">{s}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <Input className="h-11" placeholder="email@exemple.com" value={form.watch("email") || ""} onChange={(e) => form.setValue("email", e.target.value)} />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Téléphone</label>
                <Input className="h-11" placeholder="06.12.34.56.78" value={form.watch("phone") || ""} onChange={(e) => form.setValue("phone", e.target.value)} />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <Input className="h-11" type="date" value={new Date(form.watch("date")).toISOString().slice(0,10)} onChange={(e) => form.setValue("date", new Date(e.target.value))} />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Heure</label>
                <Input className="h-11" type="time" value={form.watch("time")} onChange={(e) => form.setValue("time", e.target.value)} />
              </div>
              
               <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                <label className="text-sm text-gray-600">Notes</label>
                <Textarea className="min-h-[80px]" placeholder="Instructions spéciales, allergies, etc." />
              </div>
            </div>
          </div>
        </TabsContent>
  
        <TabsContent value="menu" className="space-y-4">
          <div className="rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm">
            <div className="flex items-center gap-3 sticky top-0 z-10 bg-white/80 backdrop-blur px-5 pt-5 pb-4 border-b">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9 h-11" placeholder="Rechercher un plat..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto py-1">
                <button type="button" onClick={() => setActiveCategory(null)} className={cn("px-3 py-2 rounded-full text-sm transition", activeCategory === null ? "bg-[#FF6B35] text-white" : "bg-[#FFE5D9] text-[#FF6B35]")}>Toutes catégories</button>
                {categories.map((c) => (
                  <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)} className={cn("px-3 py-2 rounded-full text-sm whitespace-nowrap transition", activeCategory === c.id ? "bg-[#FF6B35] text-white" : "bg-[#FFE5D9] text-[#FF6B35]")}>{c.name}</button>
                ))}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 space-y-3">
              {filteredMenu.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 border border-[#FF6B35]/15 rounded-xl bg-white hover:shadow-lg transition-all">
                  {m.image && (
                    <Image width={100} height={100} src={m.image} alt={m.name} className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-[#FF6B35]">{m.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[#FF6B35]">{formatCurrency(m.price)}</span>
                  </div>
                  <Button 
                    type="button" 
                    className="bg-[#FF6B35] hover:bg-[#e35f2f] transition transform active:scale-[.98] flex-shrink-0 cursor-pointer" 
                    onClick={() => addItem(m)}
                  >
                    Ajouter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="space-y-4 rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h3 className="text-lg font-semibold text-[#FF6B35]">Articles ({items.length})</h3>
              <div className="bg-[#FFE5D9] rounded-lg px-3 py-2 font-semibold text-[#FF6B35] text-center lg:text-right">Total: {formatCurrency(form.watch("total"))}</div>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun article pour le moment</p>
                  <p className="text-xs text-gray-400 mt-1">Retournez à l&#39;onglet Menu pour ajouter des articles</p>
                </div>
              ) : (
                items.map((it, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-3 border rounded-lg p-4 hover:shadow-sm transition bg-white">
                    <div className="col-span-12 lg:col-span-5 font-medium text-[#FF6B35] text-lg">{it.name}</div>
                    <div className="col-span-6 lg:col-span-3 flex items-center gap-2 justify-center lg:justify-start">
                      <Button type="button" variant="outline" className="h-8 w-8 rounded-full text-[#FF6B35] border-[#FF6B35] hover:bg-[#FFE5D9]" onClick={() => dec(idx)}>-</Button>
                      <span className="w-8 text-center font-semibold">{it.quantity}</span>
                      <Button type="button" variant="outline" className="h-8 w-8 rounded-full text-white bg-[#FF6B35] hover:bg-[#e35f2f]" onClick={() => inc(idx)}>+</Button>
                    </div>
                    <div className="col-span-5 lg:col-span-3 text-right text-gray-700">
                      <div className="text-sm">{formatCurrency(it.price)}</div>
                      <div className="font-semibold text-[#FF6B35] text-lg">{formatCurrency(it.price * it.quantity)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                      <Button type="button" variant="ghost" className="text-[#DC2626] hover:bg-red-50 text-lg cursor-pointer" onClick={() => removeItem(idx)}>🗑️</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white to-transparent pt-3">
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()} className="border-[#FF6B35] text-[#FF6B35] cursor-pointer">Réinitialiser</Button>
          <Button type="submit" className="bg-[#FF6B35] hover:bg-[#e35f2f] cursor-pointer">{selectedOrder ? "Mettre à jour" : "Créer la commande"}</Button>
        </div>
      </div>
    </form>
  );
}

export default OrderForm;


