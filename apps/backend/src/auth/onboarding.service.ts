import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InitiateRegistrationDto } from './dto/initiate-registration.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  /**
   * Retire les champs sensibles avant de renvoyer un User dans une réponse HTTP
   * (tokens de vérification email / reset mot de passe, hash de mot de passe).
   */
  private sanitizeUser<T extends Record<string, any>>(user: T) {
    const {
      password: _pwd,
      emailVerificationToken: _evt,
      emailVerificationExpiry: _eve,
      passwordResetToken: _prt,
      passwordResetExpiry: _pre,
      ...safe
    } = user;
    return safe;
  }

  private buildAccessToken(user: {
    id: string;
    email: string;
    platformRole: string;
    tenantId?: string | null;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: 'owner',
      platformRole: user.platformRole,
      tenantId: user.tenantId ?? null,
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const MAX_TOKENS = 5;
    const existing = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (existing.length >= MAX_TOKENS) {
      const toDelete = existing.slice(0, existing.length - MAX_TOKENS + 1);
      await this.prisma.refreshToken.deleteMany({
        where: { id: { in: toDelete.map((t) => t.id) } },
      });
    }
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return rawToken;
  }

  /**
   * Étape 1 — Création du compte.
   *
   * C'est le SEUL point de l'onboarding qui écrit en base pendant l'assistant :
   * il faut bien créer le User pour pouvoir l'authentifier immédiatement (le
   * reste du wizard se fait sous session). Aucune donnée « restaurant » n'est
   * persistée ici — elle reste côté client jusqu'à `completeOnboarding`.
   */
  async initiateRegistration(dto: InitiateRegistrationDto) {
    const { firstName, lastName, email, password } = dto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: fullName,
          firstName,
          lastName,
          email,
          password: hashedPassword,
          emailVerified: false,
          emailVerificationToken: verificationTokenHash,
          emailVerificationExpiry: verificationExpiry,
          onboardingCompleted: false,
        },
      });

      const frontendUrl =
        this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
      const verifyUrl = `${frontendUrl}/auth/verify-email?token=${rawVerificationToken}`;
      await this.mailService.sendEmailVerification({
        to: email,
        name: fullName,
        verifyUrl,
      });

      const access_token = this.buildAccessToken(user);
      const refresh_token = await this.issueRefreshToken(user.id);

      return {
        access_token,
        refresh_token,
        user: { ...this.sanitizeUser(user), role: null },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(
        'initiateRegistration error',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException(
        'Erreur lors de la création du compte',
      );
    }
  }

  /**
   * Étape finale — Provisionnement complet du restaurant.
   *
   * Reçoit l'intégralité des données du wizard (accumulées côté client) et crée
   * TOUT en une transaction Prisma unique et atomique :
   *   Tenant + RestaurantSettings + TenantMembership(owner) + catégories par défaut.
   * En cas d'échec à n'importe quelle étape → rollback complet, aucune donnée
   * partielle ne subsiste. Un nouveau couple de tokens (avec le tenantId frais)
   * est émis pour que la session soit immédiatement cohérente sans reconnexion.
   *
   * NB : le « type de compte » (OWNER) n'est plus un choix — tout utilisateur qui
   * termine l'onboarding crée son restaurant et en devient OWNER. Le
   * multi-restaurants / la franchise dépendront du plan (voir plans.config.ts,
   * feature `multiSite`), pas d'un type de compte figé à l'inscription.
   */
  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Idempotence : si l'onboarding est déjà terminé (double-clic, retry réseau),
    // renvoyer l'état courant sans rien recréer.
    if (user.onboardingCompleted && user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      return {
        success: true,
        alreadyCompleted: true,
        tenant,
        user: { ...this.sanitizeUser(user), role: 'owner' },
      };
    }

    // Vérification d'unicité du slug hors transaction (feedback d'erreur rapide).
    // L'unicité réelle est garantie par l'index partiel `WHERE deletedAt IS NULL`.
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { slug: dto.slug, deletedAt: null },
    });
    if (existingTenant) throw new ConflictException('Ce slug est déjà utilisé');

    try {
      const { tenant, updatedUser } = await this.prisma.$transaction(
        async (tx) => {
          const tenant = await tx.tenant.create({
            data: {
              name: dto.restaurantName,
              slug: dto.slug,
              plan: (dto.plan || 'free') as any,
              status: 'active' as any,
              country: dto.country || null,
              currency: dto.currency || 'EUR',
              timezone: dto.timezone || 'Europe/Paris',
              cuisineType: dto.cuisineType || null,
              onboardingCompleted: true,
              settings: { create: { name: dto.restaurantName } },
            },
          });

          await tx.tenantMembership.create({
            data: { tenantId: tenant.id, userId, role: 'owner' },
          });

          await tx.menuCategory.createMany({
            data: [
              { name: 'Entrées', tenantId: tenant.id },
              { name: 'Plats', tenantId: tenant.id },
              { name: 'Desserts', tenantId: tenant.id },
              { name: 'Boissons', tenantId: tenant.id },
            ],
          });

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              tenantId: tenant.id,
              onboardingCompleted: true,
            },
          });

          return { tenant, updatedUser };
        },
      );

      const access_token = this.buildAccessToken({
        ...updatedUser,
        tenantId: tenant.id,
      });
      const refresh_token = await this.issueRefreshToken(userId);

      return {
        success: true,
        access_token,
        refresh_token,
        tenant,
        user: {
          ...this.sanitizeUser(updatedUser),
          tenantId: tenant.id,
          role: 'owner',
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(
        'completeOnboarding error',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException('Erreur lors de la finalisation');
    }
  }

  async checkSlugAvailability(slug: string) {
    const existing = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
    return { available: !existing };
  }
}
