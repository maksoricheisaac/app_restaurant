import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RevenuePeriod {
  start: Date;
  end: Date;
}

/**
 * Le chiffre d'affaires d'une période, décomposé sans ambiguïté.
 *
 * Deux écrans donnaient auparavant deux montants différents pour la même
 * journée : le tableau de bord sommait `Order.total` de toutes les commandes
 * non annulées — donc y compris celles qui n'avaient jamais été payées — et
 * les rapports sommaient `Transaction.amount`, c'est-à-dire l'argent tendu
 * par le client, monnaie rendue comprise. Aucun des deux ne portait de nom
 * disant lequel était lequel.
 *
 * Les trois montants ci-dessous sont désormais calculés à partir de la même
 * grandeur — `Order.total`, ce qui est réellement dû — sur trois populations
 * différentes. Ils sont donc comparables entre eux, et `outstanding` est une
 * soustraction exacte.
 */
export interface RevenueBreakdown {
  /** Commandes passées sur la période et non annulées, réglées ou non. */
  ordered: number;
  orderedCount: number;
  /** Part de ces commandes dont le paiement est enregistré et abouti. */
  collected: number;
  collectedCount: number;
  /** Reste à encaisser sur la période : `ordered − collected`. */
  outstanding: number;
  /** Panier moyen, calculé sur les seules commandes encaissées. */
  averageTicket: number;
}

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Les deux populations sont datées sur la **commande**, pas sur le
   * paiement — c'est ce qui rend `outstanding` interprétable : « sur ce qui a
   * été commandé aujourd'hui, voilà ce qui reste dû ».
   *
   * La clôture de caisse (`CashRegisterService.getBilan`) raisonne à
   * l'inverse, sur la date du paiement : elle répond à une autre question,
   * « qu'y a-t-il dans le tiroir ce soir ». Les deux vues sont légitimes ;
   * ce qui ne l'était pas, c'est de les présenter toutes deux comme « le
   * chiffre d'affaires ».
   */
  async compute(period: RevenuePeriod): Promise<RevenueBreakdown> {
    const base = {
      deletedAt: null,
      status: { not: 'cancelled' as const },
      createdAt: { gte: period.start, lte: period.end },
    };

    const [orderedAgg, collectedAgg] = await Promise.all([
      this.prisma.order.aggregate({
        where: base,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { ...base, payment: { is: { status: 'completed' as const } } },
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    const ordered = Number(orderedAgg._sum?.total ?? 0);
    const collected = Number(collectedAgg._sum?.total ?? 0);
    const orderedCount = orderedAgg._count?._all ?? 0;
    const collectedCount = collectedAgg._count?._all ?? 0;

    return {
      ordered,
      orderedCount,
      collected,
      collectedCount,
      outstanding: ordered - collected,
      averageTicket: collectedCount > 0 ? collected / collectedCount : 0,
    };
  }
}
