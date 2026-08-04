import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';
import { StaffRole } from '../common/constants/staff-roles.constant';

/**
 * État d'installation du logiciel, mis en cache en mémoire.
 *
 * L'installation est réputée faite quand **deux** conditions tiennent :
 *   1. l'établissement existe et porte `setupCompleted` ;
 *   2. un compte `super_admin` existe.
 *
 * Exiger les deux n'est pas de la ceinture-bretelles. Les deux lignes naissent
 * dans la même transaction, donc elles s'accordent toujours — sauf dans un cas
 * bien réel : quelqu'un supprime le compte racine en base. Le logiciel devient
 * alors ingérable, sans aucun moyen de reprendre la main. En faisant dépendre
 * l'état du compte racine, l'assistant se rouvre exactement dans ce cas, et
 * uniquement pour recréer ce compte — la configuration de l'établissement,
 * elle, n'est pas retouchée (voir `SetupService.complete`).
 *
 * `SetupGuard` s'exécute sur *chaque* requête HTTP : lire ces deux lignes à
 * chaque appel ajouterait deux allers-retours SQL à toute l'API. Le cache est
 * sûr parce que l'état est **monotone en pratique** — une fois `true`, plus
 * aucune requête n'est émise, et le cas de reprise ci-dessus suppose une
 * intervention directe en base, donc un redémarrage de l'API.
 */
@Injectable()
export class SetupStateService {
  private readonly logger = new Logger(SetupStateService.name);

  /** Vrai dès que l'installation est constatée. Ne repasse jamais à faux. */
  private completed = false;

  /** Lecture en cours, partagée par tous les appelants simultanés. */
  private inflight: Promise<boolean | null> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * `true` installé, `false` à installer, `null` **indéterminé** — base
   * injoignable. Le troisième cas est distinct des deux autres à dessein :
   * répondre `false` enverrait les visiteurs refaire une installation qui
   * existe peut-être, et `true` ferait croire à un logiciel installé alors
   * qu'on n'en sait rien. Les appelants traitent `null` en laissant passer.
   */
  async isCompleted(): Promise<boolean | null> {
    if (this.completed) return true;
    this.inflight ??= this.query().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  /**
   * Bascule le cache sans interroger la base. Appelé par `SetupService` juste
   * après la transaction d'installation : la toute première requête qui suit
   * n'a ainsi pas à redécouvrir l'état par elle-même.
   */
  markCompleted(): void {
    this.completed = true;
  }

  /**
   * Remet le cache à zéro. Réservé aux tests et aux scripts de réinitialisation
   * de base ; aucun chemin applicatif ne l'appelle.
   */
  reset(): void {
    this.completed = false;
    this.inflight = null;
  }

  private async query(): Promise<boolean | null> {
    try {
      const [restaurant, superAdmins] = await Promise.all([
        this.prisma.restaurant.findUnique({
          where: { id: RESTAURANT_ID },
          select: { setupCompleted: true },
        }),
        this.prisma.user.count({ where: { role: StaffRole.SUPER_ADMIN } }),
      ]);

      if (restaurant?.setupCompleted && superAdmins > 0) this.completed = true;
      return this.completed;
    } catch (error) {
      // Base injoignable. L'état n'est pas mis en cache : la prochaine requête
      // réessaiera. Aucun risque de double installation pour autant — ce sont
      // l'index unique partiel sur le compte racine et la clé primaire de
      // `Restaurant` qui la rendent impossible, pas ce cache.
      this.logger.error(
        "setup: état d'installation illisible",
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }
}
