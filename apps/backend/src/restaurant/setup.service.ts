import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from './restaurant.constants';
import { CompleteSetupDto } from './dto/setup.dto';
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

/**
 * Assistant de première installation.
 *
 * Remplace l'ancien onboarding SaaS : il n'y a plus ni choix de plan, ni
 * paiement, ni création de tenant — seulement la mise en service du logiciel
 * pour l'établissement qui vient de l'installer.
 */
@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Indique si l'assistant doit s'afficher. Route publique : c'est la seule
   * information qu'un visiteur non authentifié peut obtenir avant que le
   * logiciel ne soit configuré.
   */
  async getStatus() {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { setupCompleted: true, name: true },
    });

    return {
      required: !restaurant?.setupCompleted,
      restaurantName: restaurant?.name ?? null,
    };
  }

  /**
   * Exécute l'installation en UNE transaction : établissement, propriétaire,
   * permissions par défaut, horaires et carte initiale. Tout ou rien — une
   * installation qui échoue à mi-parcours ne laisse aucune donnée derrière
   * elle.
   *
   * La ré-exécution est impossible : la clé primaire de `Restaurant` est
   * constante, donc le second appel — même simultané — échoue sur violation
   * de contrainte d'unicité. C'est la base de données qui garantit l'unicité
   * de l'installation, pas un simple test applicatif sujet aux courses.
   */
  async complete(dto: CompleteSetupDto) {
    const { owner, restaurant, cash, menu, printing } = dto;

    const hashedPassword = await bcrypt.hash(owner.password, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.restaurant.create({
          data: {
            id: RESTAURANT_ID,
            name: restaurant.name,
            slogan: restaurant.slogan,
            description: restaurant.description,
            cuisineType: restaurant.cuisineType,
            logo: restaurant.logo,
            primaryColor: restaurant.primaryColor ?? '#f97316',
            phone: restaurant.phone,
            email: restaurant.email,
            address: restaurant.address,
            country: restaurant.country,
            currency: restaurant.currency,
            timezone: restaurant.timezone,
            dineInEnabled: restaurant.dineInEnabled ?? true,
            takeawayEnabled: restaurant.takeawayEnabled ?? true,
            deliveryEnabled: restaurant.deliveryEnabled ?? false,
            ...(cash ?? {}),
            ...(printing ?? {}),
            setupCompleted: true,
            setupCompletedAt: new Date(),
          },
        });

        // Le propriétaire est créé avec l'email déjà vérifié : il vient de
        // installer le logiciel sur sa propre machine, lui envoyer un lien de
        // confirmation n'apporterait aucune garantie supplémentaire.
        const ownerUser = await tx.user.create({
          data: {
            name: `${owner.firstName} ${owner.lastName}`,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            phone: owner.phone,
            password: hashedPassword,
            emailVerified: true,
            role: StaffRole.OWNER,
          },
          select: { id: true, email: true, name: true, role: true },
        });

        await tx.rolePermission.createMany({
          data: Object.entries(DEFAULT_ROLE_PERMISSIONS).map(
            ([role, permissions]) => ({ role, permissions }),
          ),
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

        return { restaurant: created, owner: ownerUser };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Le logiciel est déjà installé. Connectez-vous avec le compte propriétaire.',
        );
      }
      this.logger.error(
        'setup: échec de la première installation',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException(
        "Échec de l'installation. Aucune donnée n'a été enregistrée.",
      );
    }
  }
}
