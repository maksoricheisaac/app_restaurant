"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type MenuItemOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuItemOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number; // 0 = illimité
  options: MenuItemOption[];
};

/** Snapshot local, aligné sur ce que le serveur enregistre sur la ligne. */
export type SelectedOption = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type OptionSelection = {
  selectedOptionIds: string[];
  options: SelectedOption[];
  /** Somme des priceDelta retenus, à ajouter au prix de base. */
  priceDelta: number;
};

/** Nombre minimal de choix réellement exigé par un groupe. */
function minimumFor(group: MenuItemOptionGroup): number {
  return group.required ? Math.max(1, group.minSelect) : group.minSelect;
}

/**
 * Choix des options et suppléments au poste de caisse.
 *
 * Reprend les règles du serveur (`required`, `minSelect`, `maxSelect`) pour
 * guider l'employé, mais ne fait jamais autorité : le serveur revalide la
 * sélection et relit chaque prix en base. Ce que l'écran envoie n'est qu'une
 * liste d'identifiants.
 */
export function MenuItemOptionsDialog({
  item,
  isOpen,
  onClose,
  onConfirm,
  formatCurrency,
}: {
  item: {
    id: string;
    name: string;
    price: number;
    optionGroups?: MenuItemOptionGroup[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: OptionSelection) => void;
  formatCurrency: (amount: number) => string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const groups = useMemo(() => item?.optionGroups ?? [], [item]);

  // Repart d'une sélection vierge à chaque ouverture : deux ajouts successifs
  // du même plat sont deux lignes indépendantes.
  useEffect(() => {
    if (isOpen) setSelectedIds([]);
  }, [isOpen, item?.id]);

  const toggle = (group: MenuItemOptionGroup, optionId: string) => {
    setSelectedIds((current) => {
      const groupOptionIds = group.options.map((o) => o.id);
      const otherGroups = current.filter((id) => !groupOptionIds.includes(id));
      const inThisGroup = current.filter((id) => groupOptionIds.includes(id));

      // Choix unique : la nouvelle option remplace la précédente.
      if (group.maxSelect === 1) {
        return inThisGroup.includes(optionId)
          ? otherGroups
          : [...otherGroups, optionId];
      }

      if (inThisGroup.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }
      // Plafond atteint : le clic est sans effet plutôt que silencieusement
      // remplaçant — la case reste désactivée dans l'écran.
      if (group.maxSelect > 0 && inThisGroup.length >= group.maxSelect) {
        return current;
      }
      return [...current, optionId];
    });
  };

  const selection = useMemo<OptionSelection>(() => {
    const options: SelectedOption[] = [];
    let priceDelta = 0;

    for (const group of groups) {
      for (const option of group.options) {
        if (!selectedIds.includes(option.id)) continue;
        priceDelta += option.priceDelta;
        options.push({
          groupName: group.name,
          optionName: option.name,
          priceDelta: option.priceDelta,
        });
      }
    }

    return { selectedOptionIds: selectedIds, options, priceDelta };
  }, [groups, selectedIds]);

  const unmetGroup = groups.find((group) => {
    const count = group.options.filter((o) =>
      selectedIds.includes(o.id),
    ).length;
    return count < minimumFor(group);
  });

  if (!item) return null;

  const unitPrice = item.price + selection.priceDelta;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Choisissez les options avant d&apos;ajouter l&apos;article au panier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-1">
          {groups.map((group) => {
            const chosenInGroup = group.options.filter((o) =>
              selectedIds.includes(o.id),
            );
            const atLimit =
              group.maxSelect > 0 && chosenInGroup.length >= group.maxSelect;
            const min = minimumFor(group);

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-sm">
                    {group.name}
                    {group.required && (
                      <span className="ml-1.5 text-xs font-normal text-red-600">
                        obligatoire
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.maxSelect === 1
                      ? "1 choix"
                      : group.maxSelect > 0
                        ? `${min > 0 ? `${min} à ` : "jusqu'à "}${group.maxSelect} choix`
                        : "choix multiples"}
                  </p>
                </div>

                {group.maxSelect === 1 ? (
                  <RadioGroup
                    value={chosenInGroup[0]?.id ?? ""}
                    onValueChange={(value) => toggle(group, value)}
                    className="gap-1"
                  >
                    {group.options.map((option) => (
                      <Label
                        key={option.id}
                        htmlFor={option.id}
                        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <span className="flex-1 text-sm">{option.name}</span>
                        {option.priceDelta !== 0 && (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {option.priceDelta > 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(option.priceDelta))}
                          </span>
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const checked = selectedIds.includes(option.id);
                      const disabled = !checked && atLimit;
                      return (
                        <Label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary",
                            disabled && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <Checkbox
                            id={option.id}
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={() => toggle(group, option.id)}
                          />
                          <span className="flex-1 text-sm">{option.name}</span>
                          {option.priceDelta !== 0 && (
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {option.priceDelta > 0 ? "+" : "−"}
                              {formatCurrency(Math.abs(option.priceDelta))}
                            </span>
                          )}
                        </Label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 sm:justify-between items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Prix unitaire</p>
            <p className="font-bold text-lg tabular-nums">
              {formatCurrency(unitPrice)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!!unmetGroup}
              onClick={() => onConfirm(selection)}
            >
              {unmetGroup
                ? `Choisissez « ${unmetGroup.name} »`
                : "Ajouter au panier"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MenuItemOptionsDialog;
