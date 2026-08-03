import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { stripHtml } from '../common/utils/sanitize';

export type OrderChannel = 'pos' | 'public';
export type OrderServiceType = 'dine_in' | 'takeaway' | 'delivery';

/**
 * Une ligne de commande telle que demandée par l'appelant.
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

export interface CreateOrderInput {
  /** Origine de la commande — détermine les règles appliquées. */
  channel: OrderChannel;
  type: OrderServiceType;
  items: OrderLineInput[];
  tableId?: string | null;
  deliveryZoneId?: string | null;
  deliveryAddress?: string | null;
  /** Frais imposés à la main — canal `pos` et seulement sans zone. */
  deliveryFee?: number | null;
  specialNotes?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  /** Employé à l'origine de la saisie. Absent pour une commande client. */
  userId?: string | null;
}

/**
 * Ce qui distingue réellement une commande passée au comptoir d'une commande
 * passée par un client depuis son téléphone. Tout le reste — prix relus en
 * base, validation des options, décrément du stock, événements temps réel —
 * est identique et n'a donc pas à être écrit deux fois.
 */
interface ChannelPolicy {
  /** L'article doit être marqué disponible sur la carte. */
  requireAvailable: boolean;
  /** Autorise une ligne hors carte, au prix saisi par l'employé. */
  allowFreeformLines: boolean;
  /** Une livraison exige le choix d'une zone. */
  requireDeliveryZone: boolean;
  /** Le minimum de commande de la zone est opposable. */
  enforceDeliveryMinimum: boolean;
}

const CHANNEL_POLICIES: Record<OrderChannel, ChannelPolicy> = {
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

/**
 * Snapshot d'une option retenue, figé sur la ligne de commande.
 *
 * Déclaré en `type` et non en `interface` : Prisma exige une signature
 * d'index implicite pour écrire une valeur dans une colonne Json, ce que
 * seul un alias de type fournit.
 */
type OptionSnapshot = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

interface ResolvedLine {
  menuItemId: string | null;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
  options?: OptionSnapshot[];
}

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
 * Chemin unique de création d'une commande.
 *
 * Il n'en existe qu'un : le comptoir et le parcours client public entrent
 * tous les deux ici, via un adaptateur qui traduit leur DTO en
 * `CreateOrderInput` et passe leur `channel`. Auparavant, deux services
 * réimplémentaient séparément la même opération et avaient divergé — seul le
 * chemin public gérait les options et suppléments, si bien qu'un serveur en
 * salle ne pouvait pas saisir une cuisson que le client pouvait choisir
 * depuis son téléphone.
 *
 * Les règles qui dépendent réellement du canal sont regroupées dans
 * `CHANNEL_POLICIES`, à un seul endroit lisible.
 */
@Injectable()
export class OrderCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(input: CreateOrderInput) {
    const policy = CHANNEL_POLICIES[input.channel];

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException(
        'La commande doit contenir au moins un article',
      );
    }

    const catalogueIds = input.items
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

    const lines = input.items.map((item) =>
      this.resolveLine(item, menuItemMap, policy),
    );

    const itemsSubtotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    const delivery = await this.resolveDelivery(input, policy, itemsSubtotal);
    const total = itemsSubtotal + delivery.fee;

    // Nettoyage des champs libres : empêche un XSS stocké côté administration.
    const specialNotes = stripHtml(input.specialNotes ?? undefined) ?? null;
    const customerName = stripHtml(input.customerName ?? undefined);
    const customerPhone = stripHtml(input.customerPhone ?? undefined);
    const customerEmail = stripHtml(input.customerEmail ?? undefined);

    // Rapproche ou crée la fiche client. Hors transaction, pour ne pas
    // allonger la transaction principale.
    let customerId = input.customerId ?? null;
    if (!customerId && (customerName || customerEmail || customerPhone)) {
      customerId = await this.customersService.upsertFromInteraction({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });
    }

    const isDineIn = input.type === 'dine_in';

    const { order, lowStockWarnings } = await this.prisma.$transaction(
      async (tx) => {
        // Le tableId vient d'un QR code ou d'un choix à l'écran : il doit
        // désigner une table existante et non supprimée.
        if (isDineIn && input.tableId) {
          const table = await tx.table.findFirst({
            where: { id: input.tableId, deletedAt: null },
            select: { id: true },
          });
          if (!table) {
            throw new BadRequestException('Table introuvable');
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            type: input.type,
            status: 'pending',
            userId: input.userId ?? undefined,
            customerId,
            tableId: isDineIn ? (input.tableId ?? null) : null,
            deliveryZoneId: delivery.zoneId,
            deliveryAddress: delivery.address,
            deliveryFee: input.type === 'delivery' ? delivery.fee : null,
            total,
            specialNotes,
            orderItems: {
              create: lines.map((line) => ({
                menuItemId: line.menuItemId,
                name: line.name,
                quantity: line.quantity,
                price: line.price,
                image: line.image,
                options: line.options,
              })),
            },
          },
          include: { orderItems: true, table: true },
        });

        // Décrémente le stock des ingrédients d'après les recettes — rejette
        // toute la commande si le stock est insuffisant.
        const warnings = await this.inventoryService.decrementStockForOrder(
          tx,
          createdOrder.id,
          lines.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
          })),
        );

        return { order: createdOrder, lowStockWarnings: warnings };
      },
    );

    this.eventsService.emitToStaff('new-order', order);
    for (const warning of lowStockWarnings) {
      this.eventsService.emitToStaff('low-stock-alert', warning);
    }

    return order;
  }

  // ─── Résolution d'une ligne ────────────────────────────────────────────────

  /**
   * Fixe le nom, le prix unitaire et les options d'une ligne. Le prix d'un
   * article de la carte est TOUJOURS relu en base : celui envoyé par
   * l'appelant n'est jamais cru sur parole.
   */
  private resolveLine(
    item: OrderLineInput,
    menuItemMap: Map<string, MenuItemForOrder>,
    policy: ChannelPolicy,
  ): ResolvedLine {
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
      // Snapshot du prix unitaire : plat + options retenues.
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

  // ─── Livraison ─────────────────────────────────────────────────────────────

  /**
   * Détermine les frais de livraison. Dès qu'une zone est désignée, son
   * tarif fait foi — y compris au comptoir, où le montant était auparavant
   * accepté tel quel sans vérification.
   */
  private async resolveDelivery(
    input: CreateOrderInput,
    policy: ChannelPolicy,
    itemsSubtotal: number,
  ): Promise<{ fee: number; zoneId: string | null; address: string | null }> {
    if (input.type !== 'delivery') {
      return { fee: 0, zoneId: null, address: null };
    }

    const address = stripHtml(input.deliveryAddress ?? undefined) ?? null;

    if (!input.deliveryZoneId) {
      if (policy.requireDeliveryZone) {
        throw new BadRequestException('Veuillez choisir une zone de livraison');
      }
      // Livraison ponctuelle saisie au comptoir, hors zone publiée.
      const manualFee = input.deliveryFee ?? 0;
      if (manualFee < 0) {
        throw new BadRequestException(
          'Les frais de livraison ne peuvent pas être négatifs',
        );
      }
      return { fee: manualFee, zoneId: null, address };
    }

    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id: input.deliveryZoneId, isActive: true, deletedAt: null },
      select: { id: true, price: true, minOrder: true },
    });
    if (!zone) {
      throw new BadRequestException('Zone de livraison introuvable');
    }
    if (
      policy.enforceDeliveryMinimum &&
      zone.minOrder != null &&
      itemsSubtotal < Number(zone.minOrder)
    ) {
      throw new BadRequestException(
        `Le minimum de commande pour cette zone est de ${Number(zone.minOrder)}`,
      );
    }

    return { fee: Number(zone.price), zoneId: zone.id, address };
  }
}
