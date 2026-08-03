import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../audit/audit.service';

/**
 * Règle de correspondance entre une route et l'action métier consignée.
 *
 * L'ancienne version comparait des fragments de chemin à la main et
 * surveillait `/cash-register/payment` — une route qui n'existe pas : la
 * route réelle est `/cash-register/pay`. Aucun encaissement n'était donc
 * journalisé, précisément l'événement que ce middleware devait tracer. Des
 * motifs explicites, testés, rendent ce genre d'écart visible.
 */
interface AuditRule {
  pattern: RegExp;
  methods?: string[];
  action: string;
  entity?: string;
}

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

/**
 * Seules les écritures sont consignées : journaliser chaque lecture noierait
 * les faits sous le trafic d'affichage. L'ordre compte — la première règle
 * qui correspond gagne, donc les motifs les plus précis passent en premier.
 */
const AUDIT_RULES: AuditRule[] = [
  // ── Accès et comptes ──────────────────────────────────────────────────────
  { pattern: /^\/auth\/login\b/, action: 'auth.login', entity: 'user' },
  { pattern: /^\/auth\/logout\b/, action: 'auth.logout', entity: 'user' },
  {
    pattern: /^\/auth\/(forgot|reset)-password\b/,
    action: 'auth.password_reset',
    entity: 'user',
  },
  {
    pattern: /^\/auth\/change-password\b/,
    action: 'auth.password_change',
    entity: 'user',
  },

  // ── Première installation et configuration ────────────────────────────────
  { pattern: /^\/setup\b/, action: 'setup.complete', entity: 'restaurant' },
  {
    pattern: /^\/restaurant\b/,
    action: 'restaurant.update',
    entity: 'restaurant',
  },

  // ── Équipe et droits ──────────────────────────────────────────────────────
  {
    pattern: /^\/staff\/invites\b/,
    action: 'staff.invite',
    entity: 'staff_invite',
  },
  {
    pattern: /^\/staff\/transfer-ownership\b/,
    action: 'staff.transfer_ownership',
    entity: 'user',
  },
  { pattern: /^\/staff\b/, action: 'staff.update', entity: 'user' },
  { pattern: /^\/invites\b/, action: 'staff.accept_invite', entity: 'user' },
  {
    pattern: /^\/permissions\b/,
    action: 'permissions.update',
    entity: 'permission',
  },

  // ── Caisse — traçabilité comptable ────────────────────────────────────────
  {
    pattern: /^\/cash-register\/pay\b/,
    action: 'payment.process',
    entity: 'payment',
  },
  {
    pattern: /^\/cash-register\/session\/open\b/,
    action: 'cash_session.open',
    entity: 'cash_session',
  },
  {
    pattern: /^\/cash-register\/session\/close\b/,
    action: 'cash_session.close',
    entity: 'cash_session',
  },

  // ── Commandes ─────────────────────────────────────────────────────────────
  {
    pattern: /^\/orders\/[^/]+\/status\b/,
    action: 'order.update_status',
    entity: 'order',
  },
  {
    pattern: /^\/orders\b/,
    methods: ['DELETE'],
    action: 'order.delete',
    entity: 'order',
  },
  {
    pattern: /^\/orders\b/,
    methods: ['POST'],
    action: 'order.create',
    entity: 'order',
  },
  {
    pattern: /^\/public-menu\/order\b/,
    action: 'order.create_public',
    entity: 'order',
  },

  // ── Carte : un changement de prix est opposable ───────────────────────────
  {
    pattern: /^\/menu-options\b/,
    action: 'menu.option_update',
    entity: 'menu',
  },
  { pattern: /^\/menu\b/, action: 'menu.update', entity: 'menu' },
  { pattern: /^\/categories\b/, action: 'category.update', entity: 'category' },

  // ── Stock : écarts et pertes ──────────────────────────────────────────────
  {
    pattern: /^\/inventory\/movements\b/,
    action: 'stock.movement',
    entity: 'ingredient',
  },
  {
    pattern: /^\/inventory\b/,
    action: 'inventory.update',
    entity: 'ingredient',
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  { pattern: /^\/customers\b/, action: 'customer.update', entity: 'customer' },
];

const UUID_IN_PATH =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * L'application est montée derrière un préfixe global (`/api/v1/`, voir
 * `main.ts`). Ce middleware s'exécute au niveau Express : `req.path` porte
 * donc le préfixe. Sans ce retrait, aucun motif ancré sur `^/` ne
 * correspondrait — exactement le défaut que ces règles corrigent.
 *
 * Le numéro de version n'est pas figé : une bascule en `/api/v2` ne doit pas
 * éteindre silencieusement la piste d'audit.
 */
const GLOBAL_PREFIX = /^\/api\/v\d+/;

function normalizePath(path: string): string {
  const stripped = path.replace(GLOBAL_PREFIX, '');
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

/** Exposé pour les tests : vérifie qu'une route donnée est bien couverte. */
export function matchAuditRule(
  method: string,
  path: string,
): AuditRule | undefined {
  const normalized = normalizePath(path);
  return AUDIT_RULES.find((rule) => {
    const methods = rule.methods ?? WRITE_METHODS;
    return methods.includes(method) && rule.pattern.test(normalized);
  });
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly audit: AuditService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const rule = matchAuditRule(req.method, req.path);
    if (!rule) return next();

    const start = Date.now();
    // Capturé avant traitement : un handler peut muter le corps de la requête.
    const body = this.captureBody(req);

    res.on('finish', () => {
      const user = (req as any).user;

      this.audit.recordDetached({
        action: rule.action,
        entity: rule.entity,
        entityId: UUID_IN_PATH.exec(req.path)?.[0] ?? null,
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        userRole: user?.role ?? null,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        requestId: (req as any).requestId ?? null,
        durationMs: Date.now() - start,
        // Pour une écriture, l'état demandé EST le « après » souhaité. Les
        // services qui connaissent l'état antérieur consignent en plus leur
        // propre entrée, avec `before` renseigné.
        after: body,
      });
    });

    next();
  }

  private captureBody(req: Request): unknown {
    if (req.method === 'DELETE') return undefined;
    const body = req.body as unknown;
    if (!body || typeof body !== 'object') return undefined;
    if (Object.keys(body).length === 0) return undefined;
    // Masquage des secrets et bornage de la taille : AuditService est le seul
    // endroit qui connaît ces règles.
    return body;
  }
}
