"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MenuItemOptionsDialog,
  type MenuItemOptionGroup,
  type OptionSelection,
  type SelectedOption,
} from "@/components/customs/admin/orders/menu-item-options-dialog";
import { cn } from "@/lib/utils";

export type CatalogueItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  categoryId: string;
  available?: boolean;
  optionGroups?: MenuItemOptionGroup[];
};

export type PendingLine = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  selectedOptionIds?: string[];
  options?: SelectedOption[];
};

/** Deux lignes ne fusionnent que si plat ET options coïncident. */
function lineKey(line: PendingLine): string {
  return `${line.menuItemId}|${[...(line.selectedOptionIds ?? [])].sort().join(",")}`;
}

/**
 * Ajout d'articles à un ticket ouvert.
 *
 * Le panier composé ici n'est envoyé qu'une fois, à la validation : chaque
 * ligne part en brouillon, et c'est l'envoi en cuisine — geste distinct — qui
 * consomme le stock.
 */
export function AddLinesSheet({
  isOpen,
  onClose,
  catalogue,
  categories,
  formatCurrency,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  catalogue: CatalogueItem[];
  categories: { id: string; name: string }[];
  formatCurrency: (amount: number) => string;
  onSubmit: (lines: PendingLine[], sendImmediately: boolean) => void;
  isPending?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingLine[]>([]);
  const [optionsItem, setOptionsItem] = useState<CatalogueItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalogue.filter((item) => {
      if (activeCategory && item.categoryId !== activeCategory) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        (item.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [catalogue, search, activeCategory]);

  const total = pending.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const push = (line: PendingLine) => {
    setPending((current) => {
      const key = lineKey(line);
      const index = current.findIndex((l) => lineKey(l) === key);
      if (index >= 0) {
        const next = [...current];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + line.quantity,
        };
        return next;
      }
      return [...current, line];
    });
  };

  const addItem = (item: CatalogueItem) => {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setOptionsItem(item);
      return;
    }
    push({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      price: item.price,
    });
  };

  const confirmOptions = (selection: OptionSelection) => {
    if (!optionsItem) return;
    push({
      menuItemId: optionsItem.id,
      name: optionsItem.name,
      quantity: 1,
      price: optionsItem.price + selection.priceDelta,
      selectedOptionIds: selection.selectedOptionIds,
      options: selection.options,
    });
    setOptionsItem(null);
  };

  const submit = (sendImmediately: boolean) => {
    onSubmit(
      pending.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        selectedOptionIds: line.selectedOptionIds?.length
          ? line.selectedOptionIds
          : undefined,
      })) as PendingLine[],
      sendImmediately,
    );
    setPending([]);
  };

  const close = () => {
    setPending([]);
    setSearch("");
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Ajouter des articles</SheetTitle>
            <SheetDescription>
              Composez la tournée, puis ajoutez-la au ticket. Rien ne part en
              cuisine tant que vous ne l&apos;envoyez pas.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 border-b px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher un plat…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant={activeCategory === null ? "default" : "outline"}
                onClick={() => setActiveCategory(null)}
              >
                Toutes
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  size="sm"
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun plat ne correspond.
              </p>
            ) : (
              filtered.map((item) => {
                const hasOptions = (item.optionGroups?.length ?? 0) > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {hasOptions && (
                          <Badge variant="outline" className="gap-1 font-normal">
                            <SlidersHorizontal className="h-3 w-3" />
                            Options
                          </Badge>
                        )}
                        {item.available === false && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 font-normal text-amber-700"
                          >
                            Retiré de la carte en ligne
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatCurrency(item.price)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {pending.length > 0 && (
            <div className="max-h-48 space-y-1.5 overflow-y-auto border-t bg-muted/40 p-4">
              {pending.map((line, index) => (
                <div
                  key={`${lineKey(line)}-${index}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">
                      {line.quantity}× {line.name}
                    </span>
                    {line.options && line.options.length > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        {line.options
                          .map((o) => `${o.groupName} : ${o.optionName}`)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(line.price * line.quantity)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      setPending((c) => c.filter((_, i) => i !== index))
                    }
                    aria-label={`Retirer ${line.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <SheetFooter className="gap-2 border-t sm:flex-col">
            <div
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2",
                pending.length > 0 ? "bg-primary/10" : "bg-muted",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <ShoppingCart className="h-4 w-4" />
                {pending.length} ligne{pending.length > 1 ? "s" : ""}
              </span>
              <span className="font-bold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending.length === 0 || isPending}
                onClick={() => submit(false)}
              >
                Ajouter au ticket
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending.length === 0 || isPending}
                onClick={() => submit(true)}
              >
                Ajouter et envoyer
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <MenuItemOptionsDialog
        item={optionsItem}
        isOpen={optionsItem !== null}
        onClose={() => setOptionsItem(null)}
        onConfirm={confirmOptions}
        formatCurrency={formatCurrency}
      />
    </>
  );
}

export default AddLinesSheet;
