import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';

const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Attribution du numéro de ticket.
 *
 * Un ticket sans numéro lisible n'est pas exploitable : le personnel ne peut
 * pas s'y référer à l'oral, et aucune obligation comptable ne se satisfait
 * d'un UUID tronqué — ce que le code faisait jusqu'ici (`id.slice(-6)`).
 */
@Injectable()
export class OrderNumberingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Jour de service : la date civile dans le fuseau de l'établissement.
   *
   * Un ticket ouvert à 23 h 30 appartient à la journée qui s'achève, pas à
   * celle qui commence à Greenwich. Le fuseau est relu à chaque appel — c'est
   * une lecture d'une seule ligne, et un établissement qui corrige son fuseau
   * doit être pris en compte sans redémarrage.
   */
  async serviceDateFor(now: Date = new Date()): Promise<Date> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { timezone: true },
    });

    return toServiceDate(now, restaurant?.timezone ?? DEFAULT_TIMEZONE);
  }

  /**
   * Réserve le numéro suivant du jour.
   *
   * Doit être appelé DANS la transaction qui crée le ticket : si celle-ci
   * échoue, l'incrément est annulé avec elle et la séquence reste sans trou.
   * C'est précisément ce qu'une séquence PostgreSQL ne sait pas faire — elle
   * ne se rembobine jamais.
   *
   * `ON CONFLICT DO UPDATE` rend l'opération atomique : deux caisses qui
   * ouvrent un ticket au même instant obtiennent deux numéros distincts, la
   * seconde attendant le verrou de ligne posé par la première.
   */
  async allocate(
    tx: Prisma.TransactionClient,
    serviceDate: Date,
  ): Promise<number> {
    const rows = await tx.$queryRaw<{ lastNumber: number }[]>`
      INSERT INTO "TicketCounter" ("serviceDate", "lastNumber")
      VALUES (${serviceDate}::date, 1)
      ON CONFLICT ("serviceDate")
      DO UPDATE SET "lastNumber" = "TicketCounter"."lastNumber" + 1
      RETURNING "lastNumber"
    `;

    return rows[0].lastNumber;
  }
}

/**
 * Date civile dans un fuseau donné, ramenée à minuit UTC — la forme qu'attend
 * une colonne `DATE`. Exportée pour être testable sans base de données.
 */
export function toServiceDate(now: Date, timezone: string): Date {
  // 'en-CA' produit un format ISO (AAAA-MM-JJ) dans tous les environnements.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return new Date(`${formatter.format(now)}T00:00:00.000Z`);
}
