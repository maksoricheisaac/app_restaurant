import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';
import { CompleteSetupDto } from './dto/setup.dto';
import { SetupStateService } from './setup-state.service';
import { StaffRole } from '../common/constants/staff-roles.constant';
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions/default-role-permissions';
import * as bcrypt from 'bcrypt';

const DEFAULT_OPENING_HOURS = [
  { dayOfWeek: DayOfWeek.MONDAY, isClosed: true },
  { dayOfWeek: DayOfWeek.TUESDAY, isClosed: false },
  { dayOfWeek: DayOfWeek.WEDNESDAY, isClosed: false },
  { dayOfWeek: DayOfWeek.THURSDAY, isClosed: false },
  { dayOfWeek: DayOfWeek.FRIDAY, isClosed: false },
  { dayOfWeek: DayOfWeek.SATURDAY, isClosed: false },
  { dayOfWeek: DayOfWeek.SUNDAY, isClosed: true },
].map((d) => ({ ...d, openTime: '12:00', closeTime: '22:00' }));

/** Contexte d'appel recopié dans la piste d'audit. */
export interface SetupRequestContext {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Assistant de première installation.
 *
 * Remplace l'ancien onboarding SaaS : il n'y a plus ni choix de plan, ni
 * paiement, ni création de tenant — seulement la mise en service du logiciel
 * pour l'établissement qui vient de l'installer, et la création de son compte
 * racine `super_admin`.
 *
 * Quatre verrous indépendants empêchent un second compte racine, du plus
 * précoce au plus fondamental :
 *   1. `SetupGuard` — 403 avant même d'entrer dans le contrôleur ;
 *   2. le drapeau `bootstrapping` ci-dessous — rejette la soumission
 *      concurrente d'un même processus (double-clic, requête rejouée) ;
 *   3. l'index unique PARTIEL `User_single_super_admin_key` — dernier mot,
 *      rendu par la base, y compris entre plusieurs instances de l'API ;
 *   4. la clé primaire constante de `Restaurant`, pour l'établissement.
 */
@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  /**
   * Une installation est en cours dans ce processus. Protège du double-envoi :
   * deux requêtes parties à quelques millisecondes d'écart atteindraient
   * toutes deux le hachage bcrypt (volontairement lent) avant que la première
   * n'ait écrit quoi que ce soit en base.
   */
  private bootstrapping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly state: SetupStateService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Indique si l'assistant doit s'afficher. Route publique : c'est la seule
   * information qu'un visiteur non authentifié peut obtenir avant que le
   * logiciel ne soit configuré.
   *
   * Ne divulgue rien d'exploitable : ni le nombre de comptes, ni l'adresse du
   * compte racine, ni la version. Le nom de l'établissement est de toute façon
   * affiché publiquement sur la carte.
   */
  async getStatus() {
    const [restaurant, superAdmins] = await Promise.all([
      this.prisma.restaurant.findUnique({
        where: { id: RESTAURANT_ID },
        select: { setupCompleted: true, name: true },
      }),
      this.prisma.user.count({ where: { role: StaffRole.SUPER_ADMIN } }),
    ]);

    const installed = Boolean(restaurant?.setupCompleted) && superAdmins > 0;
    if (installed) this.state.markCompleted();

    return {
      setupRequired: !installed,
      /** @deprecated Ancien nom du champ, conservé pour les clients déployés. */
      required: !installed,
      restaurantName: restaurant?.name ?? null,
      /**
       * Vrai quand l'établissement est déjà configuré mais qu'aucun compte
       * racine ne subsiste : l'assistant ne demandera alors que ce compte, et
       * ne touchera pas à la configuration existante.
       */
      recovery: Boolean(restaurant?.setupCompleted) && superAdmins === 0,
    };
  }

  /**
   * Exécute l'installation en UNE transaction : établissement, compte racine,
   * permissions par défaut, horaires et carte initiale. Tout ou rien — une
   * installation qui échoue à mi-parcours ne laisse aucune donnée derrière
   * elle.
   *
   * **Reprise après perte du compte racine.** Si l'établissement existe déjà
   * (donc que seul le `super_admin` manque), sa configuration n'est pas
   * retouchée : ni identité, ni caisse, ni horaires, ni carte. Seul le compte
   * est recréé. Écraser l'existant serait faire payer à un exploitant la
   * perte de tout son paramétrage pour un accident de compte.
   */
  async complete(dto: CompleteSetupDto, context: SetupRequestContext = {}) {
    if (this.bootstrapping) {
      throw new ConflictException(
        'Une installation est déjà en cours. Patientez quelques instants.',
      );
    }
    this.bootstrapping = true;

    const { superAdmin, restaurant, cash, menu, printing } = dto;

    try {
      const hashedPassword = await bcrypt.hash(superAdmin.password, 10);

      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.restaurant.findUnique({
          where: { id: RESTAURANT_ID },
          select: { id: true, name: true, setupCompleted: true },
        });

        const isRecovery = existing !== null;

        if (!isRecovery && !restaurant) {
          throw new BadRequestException(
            "Les informations de l'établissement sont obligatoires à la première installation.",
          );
        }

        const establishment = isRecovery
          ? // Reprise : on ne touche qu'au drapeau, et seulement s'il manque.
            existing.setupCompleted
            ? existing
            : await tx.restaurant.update({
                where: { id: RESTAURANT_ID },
                data: { setupCompleted: true, setupCompletedAt: new Date() },
                select: { id: true, name: true, setupCompleted: true },
              })
          : await tx.restaurant.create({
              data: {
                id: RESTAURANT_ID,
                name: restaurant!.name,
                slogan: restaurant!.slogan,
                description: restaurant!.description,
                cuisineType: restaurant!.cuisineType,
                logo: restaurant!.logo,
                primaryColor: restaurant!.primaryColor ?? '#f97316',
                phone: restaurant!.phone,
                email: restaurant!.email,
                address: restaurant!.address,
                country: restaurant!.country,
                currency: restaurant!.currency,
                timezone: restaurant!.timezone,
                dineInEnabled: restaurant!.dineInEnabled ?? true,
                takeawayEnabled: restaurant!.takeawayEnabled ?? true,
                deliveryEnabled: restaurant!.deliveryEnabled ?? false,
                ...(cash ?? {}),
                ...(printing ?? {}),
                setupCompleted: true,
                setupCompletedAt: new Date(),
              },
              select: { id: true, name: true, setupCompleted: true },
            });

        // Le compte racine est créé avec l'email déjà vérifié : la personne
        // vient d'installer le logiciel sur sa propre machine, lui envoyer un
        // lien de confirmation n'apporterait aucune garantie supplémentaire —
        // et l'envoi d'email n'est pas encore configuré à cet instant.
        const rootUser = await tx.user.create({
          data: {
            name: `${superAdmin.firstName} ${superAdmin.lastName}`,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            email: superAdmin.email,
            phone: superAdmin.phone,
            password: hashedPassword,
            emailVerified: true,
            role: StaffRole.SUPER_ADMIN,
          },
          select: { id: true, email: true, name: true, role: true },
        });

        if (!isRecovery) {
          await tx.rolePermission.createMany({
            data: Object.entries(DEFAULT_ROLE_PERMISSIONS)
              // Le compte racine n'a pas de ligne configurable : ses
              // permissions ne se lisent pas en base et ne s'y écrivent pas.
              .filter(([role]) => role !== StaffRole.SUPER_ADMIN)
              .map(([role, permissions]) => ({ role, permissions })),
          });

          await tx.openingHours.createMany({ data: DEFAULT_OPENING_HOURS });

          if (menu?.length) {
            for (const category of menu) {
              const createdCategory = await tx.menuCategory.create({
                data: { name: category.name },
              });

              if (category.items?.length) {
                await tx.menuItem.createMany({
                  data: category.items.map((item) => ({
                    name: item.name,
                    description: item.description,
                    price: new Prisma.Decimal(item.price),
                    categoryId: createdCategory.id,
                  })),
                });
              }
            }
          }
        }

        return { restaurant: establishment, superAdmin: rootUser, isRecovery };
      });

      // Le garde global peut fermer l'assistant dès la requête suivante, sans
      // attendre d'avoir relu la base.
      this.state.markCompleted();

      // Premier fait de la piste d'audit : la naissance du système. L'auteur
      // est le compte racine lui-même — il n'existait aucun compte avant lui.
      await this.audit.record({
        action: result.isRecovery ? 'setup.recover' : 'setup.complete',
        entity: 'Restaurant',
        entityId: result.restaurant.id,
        userId: result.superAdmin.id,
        userEmail: result.superAdmin.email,
        userRole: result.superAdmin.role,
        method: 'POST',
        path: '/setup',
        statusCode: 201,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        after: {
          restaurantName: result.restaurant.name,
          superAdminEmail: result.superAdmin.email,
          categoriesCreated: result.isRecovery ? 0 : (menu?.length ?? 0),
          recovery: result.isRecovery,
        },
      });

      this.logger.log(
        result.isRecovery
          ? `setup: compte racine recréé pour « ${result.restaurant.name} » — ${result.superAdmin.email}`
          : `setup: installation terminée — établissement « ${result.restaurant.name} », super administrateur ${result.superAdmin.email}`,
      );

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.describeUniqueViolation(error));
      }

      // 400 « établissement manquant », 409 « installation en cours »… : ces
      // refus sont délibérés et portent déjà le bon code. Les repasser en 500
      // les rendrait indéchiffrables côté client.
      if (error instanceof HttpException) throw error;

      this.logger.error(
        'setup: échec de la première installation',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException(
        "Échec de l'installation. Aucune donnée n'a été enregistrée.",
      );
    } finally {
      this.bootstrapping = false;
    }
  }

  /**
   * Traduit une violation d'unicité en message utile.
   *
   * Trois contraintes peuvent sauter ici, et confondre « votre email est déjà
   * pris » avec « le logiciel est déjà installé » enverrait l'exploitant
   * chercher au mauvais endroit.
   */
  private describeUniqueViolation(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = JSON.stringify(error.meta?.target ?? '');

    if (target.includes('email')) {
      return 'Un compte existe déjà avec cette adresse email.';
    }

    // Index partiel du compte racine, ou clé primaire de l'établissement :
    // dans les deux cas, quelqu'un a terminé l'installation entre-temps.
    this.state.markCompleted();
    return 'Le logiciel est déjà installé. Connectez-vous avec le compte super administrateur.';
  }
}
