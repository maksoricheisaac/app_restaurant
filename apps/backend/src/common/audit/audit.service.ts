import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Un fait à consigner. Tous les champs de contexte sont facultatifs. */
export interface AuditEntry {
  action: string;
  entity?: string | null;
  entityId?: string | null;

  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;

  method?: string;
  path?: string;
  statusCode?: number;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  durationMs?: number | null;

  before?: unknown;
  after?: unknown;
}

/** Clés dont la valeur ne doit jamais atterrir dans la piste d'audit. */
const REDACTED_KEYS = [
  'password',
  'newpassword',
  'currentpassword',
  'confirmpassword',
  'token',
  'tokenhash',
  'refreshtoken',
  'accesstoken',
  'secret',
  'authorization',
  'apikey',
];

/** Au-delà, on tronque : une ligne d'audit n'est pas une sauvegarde. */
const MAX_SERIALIZED_LENGTH = 4000;

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consigne un fait.
   *
   * N'échoue jamais bruyamment : une piste d'audit indisponible ne doit pas
   * faire échouer l'encaissement qu'elle est censée tracer. L'échec est
   * journalisé en erreur pour être remonté par la supervision.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entity: entry.entity ?? null,
          entityId: entry.entityId ?? null,
          userId: entry.userId ?? null,
          userEmail: entry.userEmail ?? null,
          userRole: entry.userRole ?? null,
          method: entry.method ?? 'INTERNAL',
          path: entry.path ?? '-',
          statusCode: entry.statusCode ?? 0,
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          requestId: entry.requestId ?? null,
          durationMs: entry.durationMs ?? null,
          before: this.sanitize(entry.before),
          after: this.sanitize(entry.after),
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec d'écriture de la piste d'audit (${entry.action}) : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Consigne sans attendre l'écriture.
   *
   * Réservé aux appelants dans le chemin d'une requête HTTP, pour ne pas
   * ajouter un aller-retour base de données à la latence perçue.
   */
  recordDetached(entry: AuditEntry): void {
    void this.record(entry);
  }

  /**
   * Journal consultable par le propriétaire. Lecture seule : la table n'est
   * jamais modifiée ni purgée par l'application.
   */
  async findAll(filters: {
    action?: string;
    entity?: string;
    entityId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    skip: number;
    take: number;
  }) {
    const where = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Nettoyage ─────────────────────────────────────────────────────────────

  /**
   * Masque les secrets et borne la taille. Renvoie `undefined` — et non
   * `null` — quand il n'y a rien à écrire, pour laisser la colonne vide
   * plutôt que d'y stocker un JSON `null`.
   */
  private sanitize(value: unknown): object | undefined {
    if (value == null) return undefined;

    const redacted = this.redact(value, 0);
    if (redacted == null) return undefined;

    const serialized = JSON.stringify(redacted);
    if (serialized === undefined) return undefined;
    if (serialized.length > MAX_SERIALIZED_LENGTH) {
      return {
        _truncated: true,
        _originalLength: serialized.length,
        preview: serialized.slice(0, MAX_SERIALIZED_LENGTH),
      };
    }

    // Une valeur scalaire est enveloppée : la colonne attend un objet JSON.
    return typeof redacted === 'object' ? redacted : { value: redacted };
  }

  private redact(value: unknown, depth: number): unknown {
    if (depth > 6) return '[profondeur maximale atteinte]';
    if (value == null || typeof value !== 'object') return value;

    if (Array.isArray(value)) {
      return value.slice(0, 50).map((v) => this.redact(v, depth + 1));
    }

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACTED_KEYS.includes(key.toLowerCase())
        ? '[masqué]'
        : this.redact(val, depth + 1);
    }
    return out;
  }
}
