import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetupStateService } from './setup-state.service';
import { SETUP_EXEMPT_KEY, SETUP_ONLY_KEY } from './setup.decorators';

/**
 * Garde global : fait respecter les deux règles de l'installation initiale.
 *
 * 1. **Avant installation** — l'API entière est fermée. Seules les routes
 *    marquées `@AllowDuringSetup()` ou `@OnlyDuringSetup()` répondent. Sur une
 *    base vide, toutes les autres renverraient de toute façon des résultats
 *    vides ou des 401 : une réponse explicite `SETUP_REQUIRED` vaut mieux
 *    qu'un silence que le client devrait interpréter.
 *
 * 2. **Après installation** — les routes marquées `@OnlyDuringSetup()`
 *    (l'assistant lui-même) répondent 403, définitivement. Le refus est
 *    prononcé ici, avant le contrôleur : aucune donnée n'est lue, aucun mot de
 *    passe n'est haché, aucune transaction n'est ouverte.
 *
 * Enregistré en `APP_GUARD` avant `ThrottlerGuard` pour que le refus soit
 * rendu sans consommer de quota de débit.
 */
@Injectable()
export class SetupGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly state: SetupStateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Le garde ne concerne que le trafic HTTP. Les événements WebSocket
    // transitent par un contexte différent et passent sans être inspectés.
    if (context.getType() !== 'http') return true;

    const targets = [context.getHandler(), context.getClass()];
    const setupOnly =
      this.reflector.getAllAndOverride<boolean>(SETUP_ONLY_KEY, targets) ??
      false;
    const exempt =
      this.reflector.getAllAndOverride<boolean>(SETUP_EXEMPT_KEY, targets) ??
      false;

    const completed = await this.state.isCompleted();

    // État indéterminé (base injoignable) : on laisse passer. La route appelée
    // échouera sur son propre accès base, avec une erreur qui dit la vérité —
    // préférable à un 403 « déjà installé » ou à un 503 « à installer » qui
    // enverraient l'exploitant sur une fausse piste.
    if (completed === null) return true;

    if (completed) {
      if (setupOnly) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'SETUP_ALREADY_COMPLETED',
          message:
            'Le logiciel est déjà installé. Connectez-vous avec le compte propriétaire.',
        });
      }
      return true;
    }

    if (setupOnly || exempt) return true;

    // 503 et non 403 : le service n'est pas *interdit*, il n'est pas *encore
    // configuré*. Le code `SETUP_REQUIRED` permet au client de distinguer ce
    // cas d'une session expirée et de rediriger vers l'assistant.
    throw new ServiceUnavailableException({
      statusCode: 503,
      code: 'SETUP_REQUIRED',
      setupRequired: true,
      message:
        "Le logiciel n'est pas encore installé. Terminez la première installation.",
    });
  }
}
