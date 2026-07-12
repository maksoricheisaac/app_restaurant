import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PlansService } from './plans.catalog.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * Catalogue public des plans — consommé par la page Pricing et l'onboarding.
 * Source de vérité data-driven : toute modification faite par le Super Admin
 * est reflétée ici immédiatement (cache mémoire court côté service).
 *
 * Lecture publique, en lecture seule et déjà mise en cache 30 s côté service :
 * on ignore le throttling (comme /health). Le débiter comme un endpoint normal
 * (60 req/min) faisait sauter la limite dès que plusieurs composants montaient
 * le catalogue → 429 → « les plans n'apparaissent pas ». La déduplication est
 * aussi assurée côté client (cache + requête in-flight partagée).
 */
@Controller('/plans')
export class PublicPlansController {
  constructor(private readonly plans: PlansService) {}

  @Public()
  @SkipThrottle()
  @Get('catalog')
  getCatalog() {
    return this.plans.getPublicCatalog();
  }
}
