import { cn } from "@/lib/utils";
import type { OrderItemOption } from "@/types/order";

/**
 * Options et suppléments d'une ligne de commande.
 *
 * Le serveur enregistre ce détail depuis l'ajout des options à la carte, mais
 * aucun écran ne l'affichait — l'écran cuisine montrait « 1× Burger » sans
 * la cuisson demandée, ce qui rendait l'information inutilisable là où elle
 * comptait le plus.
 *
 * `kitchen` : lecture à distance, pour le poste de préparation.
 * `compact` : ligne discrète, pour les listes et les tickets.
 */
export function OrderItemOptions({
  options,
  tone = "compact",
  className,
}: {
  options?: OrderItemOption[] | null;
  tone?: "kitchen" | "compact";
  className?: string;
}) {
  if (!options || options.length === 0) return null;

  if (tone === "kitchen") {
    return (
      <ul className={cn("mt-1 space-y-0.5", className)}>
        {options.map((option, index) => (
          <li
            key={`${option.groupName}-${option.optionName}-${index}`}
            className="flex items-baseline gap-1.5 text-sm font-semibold text-slate-700"
          >
            <span aria-hidden="true" className="text-slate-400">
              ↳
            </span>
            <span className="text-slate-500 font-normal">
              {option.groupName} :
            </span>
            <span>{option.optionName}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("mt-0.5 space-y-0.5", className)}>
      {options.map((option, index) => (
        <li
          key={`${option.groupName}-${option.optionName}-${index}`}
          className="text-xs text-muted-foreground"
        >
          {option.groupName} :{" "}
          <span className="text-foreground">{option.optionName}</span>
        </li>
      ))}
    </ul>
  );
}

export default OrderItemOptions;
