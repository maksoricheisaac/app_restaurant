import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stripHtml } from '../common/utils/sanitize';

export type OrderChannel = 'pos' | 'public';

/**
 * Une ligne telle que demandée par l'appelant.
 *
 * Deux formes possibles :
 *  - ligne de carte : `menuItemId` renseigné. Nom, prix et image sont relus
 *    en base ; ce que l'appelant a pu envoyer dans ces champs est ignoré.
 *  - ligne libre : pas de `menuItemId`, `name` et `price` saisis à la main.
 *    Réservée au canal `pos` (article hors carte facturé au comptoir).
 */
export interface OrderLineInput {
  menuItemId?: string | null;
  quantity: number;
  /** IDs des options choisies, tous groupes confondus. Revalidés serveur. */
  selectedOptionIds?: string[];
  /** Ligne libre uniquement. */
  name?: string | null;
  /** Ligne libre uniquement. */
  price?: number | null;
  /** Ligne libre uniquement. */
  image?: string | null;
}

/** Snapshot d'une option retenue, figé sur la ligne de commande. */
export type OptionSnapshot = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export interface PricedLine {
  menuItemId: string | null;
  name: string;
  quantity: number;
  /** Prix unitaire : plat + options retenues. */
  price: number;
  image: string | null;
  options?: OptionSnapshot[];
}

/**
 * Ce qui distingue réellement une saisie au comptoir d'une commande passée
 * par un client depuis son téléphone.
 */
export interface ChannelPolicy {
  /** L'article doit être marqué disponible sur la carte. */
  requireAvailable: boolean;
  /** Autorise une ligne hors carte, au prix saisi par l'employé. */
  allowFreeformLines: boolean;
  /** Une livraison exige le choix d'une zone. */
  requireDeliveryZone: boolean;
  /** Le minimum de commande de la zone est opposable. */
  enforceDeliveryMinimum: boolean;
}

export const CHANNEL_POLICIES: Record<OrderChannel, ChannelPolicy> = {
  // Le client ne voit que la carte disponible et se voit opposer les règles
  // commerciales publiées (zone de livraison, minimum de commande).
  public: {
    requireAvailable: true,
    allowFreeformLines: false,
    requireDeliveryZone: true,
    enforceDeliveryMinimum: true,
  },
  // L'employé sait ce qu'il fait : il peut vendre un article retiré de la
  // carte en ligne, facturer un article hors carte, et accepter une livraison
  // sous le minimum. Les prix de la carte restent malgré tout relus en base.
  pos: {
    requireAvailable: false,
    allowFreeformLines: true,
    requireDeliveryZone: false,
    enforceDeliveryMinimum: false,
  },
};

type MenuItemForOrder = {
  id: string;
  name: string;
  price: unknown;
  image: string | null;
  optionGroups: {
    id: string;
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    options: { id: string; name: string; priceDelta: unknown }[];
  }[];
};

/**
 * Fixe le nom, le prix unitaire et les options de chaque ligne.
 *
 * Extrait de la création de commande parce que l'ajout d'une tournée à un
 * ticket déjà ouvert doit appliquer exactement les mêmes règles : un prix
 * relu en base, des options revalidées. Deux implémentations auraient
 * divergé, comme l'avaient fait le comptoir et le parcours public.
 */
@Injectable()
export class OrderLinePricingService {
  constructor(private readonly prisma: PrismaService) {}

  async priceLines(
    items: OrderLineInput[],
    channel: OrderChannel,
  ): Promise<PricedLine[]> {
    const policy = CHANNEL_POLICIES[channel];

    if (!items || items.length === 0) {
      throw new BadRequestException('Au moins un article est requis');
    }

    const catalogueIds = items
      .filter((i) => i.menuItemId)
      .map((i) => i.menuItemId as string);

    const menuItems =
      catalogueIds.length > 0
        ? ((await this.prisma.menuItem.findMany({
            where: {
              id: { in: catalogueIds },
              deletedAt: null,
              ...(policy.requireAvailable ? { available: true } : {}),
            },
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              optionGroups: {
                where: { deletedAt: null },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                select: {
                  id: true,
                  name: true,
                  required: true,
                  minSelect: true,
                  maxSelect: true,
                  options: {
                    where: { available: true, deletedAt: null },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    select: { id: true, name: true, priceDelta: true },
                  },
                },
              },
            },
          })) as MenuItemForOrder[])
        : [];

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    return items.map((item) => this.priceLine(item, menuItemMap, policy));
  }

  private priceLine(
    item: OrderLineInput,
    menuItemMap: Map<string, MenuItemForOrder>,
    policy: ChannelPolicy,
  ): PricedLine {
    if (!item.menuItemId) {
      if (!policy.allowFreeformLines) {
        throw new BadRequestException(
          'Chaque article doit référencer un plat de la carte',
        );
      }
      const name = stripHtml(item.name ?? undefined);
      if (!name || item.price == null || item.price < 0) {
        throw new BadRequestException(
          'Un article hors carte exige un libellé et un prix',
        );
      }
      return {
        menuItemId: null,
        name,
        quantity: item.quantity,
        price: item.price,
        image: item.image ?? null,
      };
    }

    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      throw new BadRequestException(
        `Article inconnu ou indisponible : ${item.menuItemId}`,
      );
    }

    const { optionsDelta, snapshot } = this.resolveOptions(
      menuItem,
      item.selectedOptionIds ?? [],
    );

    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      price: Number(menuItem.price) + optionsDelta,
      image: menuItem.image,
      options: snapshot.length > 0 ? snapshot : undefined,
    };
  }

  /**
   * Valide les choix d'options groupe par groupe (`required`, `minSelect`,
   * `maxSelect`) et revalorise chaque option depuis la base.
   */
  private resolveOptions(
    menuItem: MenuItemForOrder,
    selectedOptionIds: string[],
  ): { optionsDelta: number; snapshot: OptionSnapshot[] } {
    const selectedIds = new Set(selectedOptionIds);
    const snapshot: OptionSnapshot[] = [];
    const validOptionIds = new Set<string>();
    let optionsDelta = 0;

    for (const group of menuItem.optionGroups ?? []) {
      const chosen = group.options.filter((o) => selectedIds.has(o.id));
      chosen.forEach((o) => validOptionIds.add(o.id));

      const min = group.required
        ? Math.max(1, group.minSelect)
        : group.minSelect;
      if (chosen.length < min) {
        throw new BadRequestException(
          `« ${menuItem.name} » : veuillez choisir au moins ${min} option(s) pour « ${group.name} »`,
        );
      }
      if (group.maxSelect > 0 && chosen.length > group.maxSelect) {
        throw new BadRequestException(
          `« ${menuItem.name} » : au plus ${group.maxSelect} option(s) pour « ${group.name} »`,
        );
      }

      for (const option of chosen) {
        optionsDelta += Number(option.priceDelta);
        snapshot.push({
          groupName: group.name,
          optionName: option.name,
          priceDelta: Number(option.priceDelta),
        });
      }
    }

    // Rejette tout ID inconnu, indisponible, ou appartenant à un autre plat.
    for (const id of selectedIds) {
      if (!validOptionIds.has(id)) {
        throw new BadRequestException(
          `« ${menuItem.name} » : option sélectionnée invalide`,
        );
      }
    }

    return { optionsDelta, snapshot };
  }
}
