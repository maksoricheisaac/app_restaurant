import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';

/** Régime fiscal en vigueur, tel que paramétré par l'établissement. */
export interface TaxPolicy {
  /** Taux appliqué à un article qui n'en déclare pas, en pourcentage. */
  defaultRate: number;
  /** true = les prix saisis sont TTC, false = HT. */
  pricesIncludeTax: boolean;
}

/** Ce qui est connu d'une ligne au moment de déterminer son taux. */
export interface TaxableLineContext {
  /** Taux propre à l'article, s'il en déclare un. */
  menuItemTaxRate?: number | null;
  /** Mode de service du ticket. Voir la note sur les taux différenciés. */
  serviceType: 'dine_in' | 'takeaway' | 'delivery';
}

/**
 * Détermine le taux de TVA applicable à une ligne.
 *
 * ═══ POINT D'EXTENSION ═══════════════════════════════════════════════════
 *
 * La règle actuelle est volontairement simple : **taux de l'article, sinon
 * taux par défaut de l'établissement**. Elle couvre un régime à taux unique
 * comme un régime à taux multiples déclarés article par article.
 *
 * Elle ne couvre PAS le cas où le taux dépend aussi du mode de service — en
 * France, un même plat relève de 10 % sur place et de 5,5 % à emporter, tandis
 * que l'alcool reste à 20 % dans les deux cas. `serviceType` est déjà transmis
 * ici pour que ce cas se traite à cet endroit précis, sans toucher au calcul
 * ni au stockage : les montants sont figés sur la ligne quel que soit le
 * chemin qui a produit le taux.
 *
 * Concrètement, un régime différencié demanderait d'ajouter à `MenuItem` un
 * second taux (« à emporter ») et de choisir ici selon `serviceType`. Rien
 * d'autre ne bouge.
 * ═════════════════════════════════════════════════════════════════════════
 */
@Injectable()
export class TaxRateResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lit le régime en vigueur. Une seule ligne, relue à chaque commande : un
   * changement de taux doit s'appliquer au ticket suivant, pas au prochain
   * redémarrage.
   */
  async getPolicy(): Promise<TaxPolicy> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { taxRate: true, taxIncluded: true },
    });

    return {
      defaultRate: Number(restaurant?.taxRate ?? 0),
      pricesIncludeTax: restaurant?.taxIncluded ?? true,
    };
  }

  /**
   * Taux applicable à une ligne. Un taux d'article à 0 est un choix explicite
   * — exonération — et n'est donc pas remplacé par le taux par défaut ; seule
   * l'absence de taux (`null`) déclenche le repli.
   */
  resolveRate(policy: TaxPolicy, context: TaxableLineContext): number {
    const itemRate = context.menuItemTaxRate;
    if (itemRate !== null && itemRate !== undefined) {
      return Number(itemRate);
    }
    return policy.defaultRate;
  }
}
