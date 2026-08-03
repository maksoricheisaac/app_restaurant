"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, ShoppingCart, FileText, ChevronRight, ChevronLeft, Check, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import {
  MenuItemOptionsDialog,
  type MenuItemOptionGroup,
  type OptionSelection,
  type SelectedOption,
} from "./menu-item-options-dialog";

export type FormValues = {
  type: 'dine_in' | 'takeaway' | 'delivery';
  tableId?: string;
  specialNotes?: string;
  customerId?: string;
  userId?: string;
  deliveryAddress?: string;
  deliveryZoneId?: string;
  deliveryFee?: number;
  total?: number;
  items: {
    menuItemId?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    selectedOptionIds?: string[];
    options?: SelectedOption[];
  }[];
  [key: string]: unknown;
};

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
type OrderType = "dine_in" | "takeaway" | "delivery";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  categoryId: string;
  available?: boolean;
  optionGroups?: MenuItemOptionGroup[];
};
type Category = { id: string; name: string };
type Customer = { id: string; name?: string | null; email?: string | null };
type Table = { id: string; number: number; seats: number };

type OrderItemForm = {
  name: string;
  quantity: number;
  /** Prix unitaire options comprises — recalculé serveur à la validation. */
  price: number;
  image?: string;
  menuItemId?: string;
  selectedOptionIds?: string[];
  options?: SelectedOption[];
};

/**
 * Deux lignes ne fusionnent que si elles portent le même plat ET la même
 * sélection d'options : un burger saignant et un burger à point restent deux
 * lignes distinctes, comme sur le ticket de cuisine.
 */
function lineKey(item: {
  menuItemId?: string;
  name: string;
  price: number;
  selectedOptionIds?: string[];
}): string {
  const options = [...(item.selectedOptionIds ?? [])].sort().join(",");
  return `${item.menuItemId ?? item.name}|${item.price}|${options}`;
}


export function OrderForm({
  form,
  onSubmit,
  selectedOrder,
  customers,
  tables,
  menuItems,
  categories,
}: {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => Promise<void> | void;
  selectedOrder: unknown | null;
  customers: Customer[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: Category[];
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  /** Plat dont on est en train de choisir les options, le cas échéant. */
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);

  const items = (form.watch("items") as OrderItemForm[]) || [];

  const steps = [
    { number: 1, title: "Informations", icon: User, description: "Détails de la commande" },
    { number: 2, title: "Menu", icon: ShoppingCart, description: "Sélection des articles" },
    { number: 3, title: "Récapitulatif", icon: FileText, description: "Vérification et confirmation" },
  ];

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

  /** Ajoute une ligne au panier, ou incrémente celle qui lui est identique. */
  const pushLine = (line: OrderItemForm) => {
    const key = lineKey(line);
    const existingIndex = items.findIndex((it) => lineKey(it) === key);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + line.quantity,
      };
      form.setValue("items", updated, { shouldDirty: true });
      toast.success(`Quantité de "${line.name}" augmentée`, {
        description: `Quantité actuelle : ${updated[existingIndex].quantity}`,
        duration: 2000,
      });
    } else {
      form.setValue("items", [...items, line], { shouldDirty: true });
      toast.success(`"${line.name}" ajouté au panier`, {
        description: `${formatCurrency(line.price)} • Quantité : ${line.quantity}`,
        duration: 2000,
      });
    }
    computeTotal();
  };

  const addItem = (m: MenuItem) => {
    // Un plat porteur d'options passe par le sélecteur : c'est le seul moyen
    // de saisir en salle une cuisson ou un supplément que le client peut déjà
    // choisir depuis son téléphone.
    if (m.optionGroups && m.optionGroups.length > 0) {
      setOptionsItem(m);
      return;
    }

    pushLine({
      name: m.name,
      quantity: 1,
      price: m.price,
      image: m.image || undefined,
      menuItemId: m.id,
    });
  };

  const handleOptionsConfirm = (selection: OptionSelection) => {
    if (!optionsItem) return;

    pushLine({
      name: optionsItem.name,
      quantity: 1,
      price: optionsItem.price + selection.priceDelta,
      image: optionsItem.image || undefined,
      menuItemId: optionsItem.id,
      selectedOptionIds: selection.selectedOptionIds,
      options: selection.options,
    });
    setOptionsItem(null);
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
    const itemsTotal = list.reduce((acc: number, it: OrderItemForm) => acc + (it.quantity || 0) * (it.price || 0), 0);
    const deliveryFee = form.getValues("deliveryFee") || 0;
    const total = itemsTotal + deliveryFee;
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

  const statusLabels: Record<OrderStatus, string> = {
    pending: "En attente",
    preparing: "En préparation",
    ready: "Prête",
    served: "Servie",
    cancelled: "Annulée",
  };

  const typeLabels: Record<OrderType, string> = {
    dine_in: "Sur place",
    takeaway: "À emporter",
    delivery: "Livraison",
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      // Validation étape 1: au moins un userId doit être défini
      const userId = form.getValues("userId");
      if (!userId || userId === "") {
        toast.error("Veuillez sélectionner un client");
        return false;
      }
      return true;
    }
    if (step === 2) {
      // Validation étape 2: au moins un article
      if (items.length === 0) {
        toast.error("Veuillez ajouter au moins un article au panier");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmOrder = async () => {
    // Fonction explicite pour confirmer la commande
    // Ne peut être appelée que par un clic sur le bouton "Confirmer"
    if (currentStep !== 3) {
      toast.warning("Veuillez compléter toutes les étapes avant de confirmer");
      return;
    }

    // Validation finale avant soumission
    if (items.length === 0) {
      toast.error("Impossible de créer une commande sans articles");
      return;
    }

    // Soumettre le formulaire
    const values = form.getValues();
    await onSubmit(values);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ne rien faire ici - la soumission est gérée par handleConfirmOrder
    // Cette fonction intercepte juste les soumissions implicites (Entrée, etc.)
    if (currentStep !== 3) {
      toast.warning("Veuillez compléter toutes les étapes avant de confirmer");
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="space-y-6 bg-gradient-to-b from-white to-[#FFF7F3] p-4"
    >
      {/* Indicateur de progression */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            
            return (
              <div key={step.number} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted && "bg-[#FF6B35] border-[#FF6B35] text-white",
                      isActive && "bg-[#FF6B35] border-[#FF6B35] text-white scale-110 shadow-lg",
                      !isCompleted && !isActive && "bg-white border-gray-300 text-gray-400"
                    )}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn("text-sm font-semibold", isActive ? "text-[#FF6B35]" : "text-gray-500")}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2", isCompleted ? "bg-[#FF6B35]" : "bg-gray-300")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Étape 1: Informations */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#FF6B35] mb-4">Informations de la commande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Client</label>
                <Select onValueChange={(v) => form.setValue("userId", v)} value={(form.watch("userId") as string) || ""}>
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
                <label className="text-sm text-gray-600">Table (optionnel)</label>
                <Select onValueChange={(v) => form.setValue("tableId", v === "none" ? undefined : v)} value={(form.watch("tableId") as string) || "none"}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Aucune table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune table</SelectItem>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>Table {t.number} • {t.seats} places</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <Select onValueChange={(v: OrderType) => form.setValue("type", v)} value={(form.watch("type") as OrderType)}>
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
                <Select onValueChange={(v: OrderStatus) => form.setValue("status", v)} value={(form.watch("status") as OrderStatus)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["pending","preparing","ready","served","cancelled"] as OrderStatus[]).map(s => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("h-5", statusBadge(s))}></Badge>
                          <span className="font-medium">{statusLabels[s]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Delivery Fee - Only show for delivery orders */}
            {form.watch("type") === "delivery" && (
              <div className="mt-4">
                <label className="text-sm text-gray-600">Frais de livraison (FCFA)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.watch("deliveryFee") || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    form.setValue("deliveryFee", value);
                    computeTotal();
                  }}
                  className="h-11"
                />
              </div>
            )}
            
            {/* Special Notes */}
            <div className="mt-4">
              <label className="text-sm text-gray-600">Notes spéciales (optionnel)</label>
              <textarea
                placeholder="Instructions spéciales, allergies, préférences..."
                value={form.watch("specialNotes") || "-"}
                onChange={(e) => form.setValue("specialNotes", e.target.value || "-")}
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Étape 2: Menu */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3 sticky top-0 z-10 bg-white/80 backdrop-blur px-5 pt-5 pb-4 border-b">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9 h-11" placeholder="Rechercher un plat..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto py-3 px-5 border-b">
              <button type="button" onClick={() => setActiveCategory(null)} className={cn("px-4 py-2 rounded-full text-sm transition whitespace-nowrap", activeCategory === null ? "bg-[#FF6B35] text-white" : "bg-[#FFE5D9] text-[#FF6B35]")}>
                Toutes catégories
              </button>
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)} className={cn("px-4 py-2 rounded-full text-sm whitespace-nowrap transition", activeCategory === c.id ? "bg-[#FF6B35] text-white" : "bg-[#FFE5D9] text-[#FF6B35]")}>
                  {c.name}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-5 pb-5 pt-3 space-y-3">
              {filteredMenu.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun plat trouvé</p>
                  <p className="text-sm text-gray-400 mt-1">Essayez un autre terme de recherche</p>
                </div>
              ) : (
                filteredMenu.map((m) => {
                  const hasOptions = (m.optionGroups?.length ?? 0) > 0;
                  const isUnavailable = m.available === false;
                  return (
                  <div key={m.id} className="flex items-center gap-4 p-4 border border-[#FF6B35]/15 rounded-xl bg-white hover:shadow-lg transition-all">
                    {m.image && (
                      <Image width={100} height={100} src={m.image} alt={m.name} className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#FF6B35]">{m.name}</p>
                        {hasOptions && (
                          <Badge variant="outline" className="gap-1 text-[#FF6B35] border-[#FF6B35]/40 font-normal">
                            <SlidersHorizontal className="h-3 w-3" />
                            Options
                          </Badge>
                        )}
                        {isUnavailable && (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-normal">
                            Retiré de la carte en ligne
                          </Badge>
                        )}
                      </div>
                      {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#FF6B35]">{formatCurrency(m.price)}</span>
                    </div>
                    <Button
                      type="button"
                      className="bg-[#FF6B35] hover:bg-[#e35f2f] transition transform active:scale-[.98] flex-shrink-0 cursor-pointer"
                      onClick={() => addItem(m)}
                    >
                      {hasOptions ? "Choisir" : "Ajouter"}
                    </Button>
                  </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Panier flottant */}
          {items.length > 0 && (
            <div className="bg-[#FFE5D9] rounded-xl p-4 border-2 border-[#FF6B35]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#FF6B35]" />
                  <span className="font-semibold text-[#FF6B35]">{items.length} article{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="text-lg font-bold text-[#FF6B35]">{formatCurrency((form.watch("total") as number) || 0)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Étape 3: Récapitulatif */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {/* Informations de la commande */}
          <div className="rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#FF6B35] mb-4">Informations de la commande</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-semibold text-gray-900">
                  {customers.find(c => c.id === form.watch("userId"))?.name || 
                   customers.find(c => c.id === form.watch("userId"))?.email || 
                   "Client comptoir"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Table</p>
                <p className="font-semibold text-gray-900">
                  {form.watch("tableId") && form.watch("tableId") !== "none" 
                    ? `Table ${tables.find(t => t.id === form.watch("tableId"))?.number}` 
                    : "Aucune"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Type de commande</p>
                <p className="font-semibold text-gray-900">{typeLabels[form.watch("type") as OrderType]}</p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <div className="flex items-center gap-2">
                  <Badge className={cn("h-5", statusBadge(form.watch("status") as OrderStatus))}></Badge>
                  <span className="font-semibold text-gray-900">{statusLabels[form.watch("status") as OrderStatus]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Articles commandés */}
          <div className="space-y-4 rounded-xl border border-[#FF6B35]/15 bg-white/70 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-[#FF6B35] mb-4">Articles commandés ({items.length})</h3>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun article pour le moment</p>
                </div>
              ) : (
                items.map((it, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-3 border rounded-lg p-4 hover:shadow-sm transition bg-white">
                    <div className="col-span-12 lg:col-span-5">
                      <p className="font-medium text-[#FF6B35] text-lg">{it.name}</p>
                      {it.options && it.options.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {it.options.map((opt, optIdx) => (
                            <li key={optIdx} className="text-xs text-gray-500">
                              {opt.groupName} : <span className="text-gray-700">{opt.optionName}</span>
                              {opt.priceDelta !== 0 && (
                                <span className="tabular-nums">
                                  {" "}({opt.priceDelta > 0 ? "+" : "−"}
                                  {formatCurrency(Math.abs(opt.priceDelta))})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="col-span-6 lg:col-span-3 flex items-center gap-2 justify-center lg:justify-start">
                      <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-full text-[#FF6B35] border-[#FF6B35] hover:bg-[#FFE5D9]" onClick={() => dec(idx)}>-</Button>
                      <span className="w-8 text-center font-semibold">{it.quantity}</span>
                      <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-full text-white bg-[#FF6B35] hover:bg-[#e35f2f]" onClick={() => inc(idx)}>+</Button>
                    </div>
                    <div className="col-span-5 lg:col-span-3 text-right text-gray-700">
                      <div className="text-sm">{formatCurrency(it.price)} × {it.quantity}</div>
                      <div className="font-semibold text-[#FF6B35] text-lg">{formatCurrency(it.price * it.quantity)}</div>
                    </div>
                    <div className="col-span-1 text-right">
                      <Button type="button" variant="ghost" size="sm" className="text-[#DC2626] hover:bg-red-50 text-lg cursor-pointer" onClick={() => removeItem(idx)}>🗑️</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Total breakdown */}
            <div className="border-t pt-4 mt-4 space-y-2">
              {form.watch("deliveryFee") && form.watch("deliveryFee")! > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatCurrency(items.reduce((acc, it) => acc + it.price * it.quantity, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{formatCurrency(form.watch("deliveryFee")!)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center bg-[#FFE5D9] rounded-lg px-4 py-3">
                <span className="font-bold text-[#FF6B35] text-lg">Total</span>
                <span className="font-bold text-[#FF6B35] text-lg">{formatCurrency((form.watch("total") as number) || 0)}</span>
              </div>
            </div>
            
            {/* Special notes display */}
            {form.watch("specialNotes") && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mt-4">
                <p className="font-semibold text-sm text-gray-700 mb-1">Notes spéciales :</p>
                <p className="text-sm text-gray-600">{form.watch("specialNotes")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white to-transparent pt-4">
        <div className="flex justify-between gap-3">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevious}
                className="border-[#FF6B35] text-[#FF6B35] hover:bg-[#FFE5D9] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()} 
              className="border-gray-300 text-gray-600 cursor-pointer"
            >
              Réinitialiser
            </Button>
            
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                className="bg-[#FF6B35] hover:bg-[#e35f2f] cursor-pointer"
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleConfirmOrder}
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <Check className="h-4 w-4 mr-2" />
                {selectedOrder ? "Mettre à jour la commande" : "Confirmer la commande"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Choix des options du plat sélectionné */}
      <MenuItemOptionsDialog
        item={optionsItem}
        isOpen={optionsItem !== null}
        onClose={() => setOptionsItem(null)}
        onConfirm={handleOptionsConfirm}
        formatCurrency={formatCurrency}
      />
    </form>
  );
}

export default OrderForm;


