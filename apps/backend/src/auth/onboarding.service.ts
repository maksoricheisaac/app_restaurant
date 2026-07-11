import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';

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
   * Inscription complète — UNIQUE point d'écriture de tout le parcours.
   *
   * Reçoit l'intégralité des données du wizard (compte + restaurant), accumulées
   * côté client, et provisionne TOUT en une transaction Prisma unique et
   * atomique :
   *   User + Tenant + RestaurantSettings + TenantMembership(owner) + catégories.
   *
   * Aucune donnée — le compte inclus — n'existe en base tant que l'utilisateur
   * n'a pas terminé le wizard. En cas d'échec à n'importe quelle étape →
   * rollback complet, aucune trace partielle (pas de compte « fantôme »).
   *
   * Le tenant est créé sur le plan `free`. La souscription à un plan payant est
   * gérée juste après par le checkout `/billing/*` (upgrade via webhook), afin
   * de ne jamais accorder l'accès à un plan payant avant paiement effectif.
   */
  async register(dto: RegisterDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      restaurantName,
      slug,
      country,
      currency,
      timezone,
      cuisineType,
    } = dto;

    // Feedback rapide (hors transaction) — l'unicité réelle reste garantie par
    // les contraintes d'unicité (email) / index partiel (slug) plus bas.
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) throw new ConflictException('Cet email est déjà utilisé');

    const existingTenant = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existingTenant) throw new ConflictException('Ce slug est déjà utilisé');

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
      const { tenant, user } = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
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

        const tenant = await tx.tenant.create({
          data: {
            name: restaurantName,
            slug,
            plan: 'free' as any,
            status: 'active' as any,
            country: country || null,
            currency: currency || 'EUR',
            timezone: timezone || 'Europe/Paris',
            cuisineType: cuisineType || null,
            onboardingCompleted: true,
            settings: { create: { name: restaurantName } },
          },
        });

        await tx.tenantMembership.create({
          data: { tenantId: tenant.id, userId: user.id, role: 'owner' },
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
          where: { id: user.id },
          data: { tenantId: tenant.id, onboardingCompleted: true },
        });

        return { tenant, user: updatedUser };
      });

      // Email de vérification — best-effort : la transaction est déjà validée,
      // une panne mail ne doit pas faire échouer une inscription réussie.
      try {
        const frontendUrl =
          this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
        const verifyUrl = `${frontendUrl}/auth/verify-email?token=${rawVerificationToken}`;
        await this.mailService.sendEmailVerification({
          to: email,
          name: fullName,
          verifyUrl,
        });
      } catch (mailError) {
        this.logger.error(
          'register: échec envoi email de vérification (inscription conservée)',
          mailError instanceof Error ? mailError.message : String(mailError),
        );
      }

      const access_token = this.buildAccessToken({
        ...user,
        tenantId: tenant.id,
      });
      const refresh_token = await this.issueRefreshToken(user.id);

      return {
        success: true,
        access_token,
        refresh_token,
        tenant,
        user: {
          ...this.sanitizeUser(user),
          tenantId: tenant.id,
          role: 'owner',
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      // Course sur une contrainte d'unicité (email/slug) entre le pré-check et
      // le commit — renvoyer un 409 explicite plutôt qu'un 500 opaque.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Cet email ou ce slug est déjà utilisé');
      }
      this.logger.error(
        'register error',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException(
        "Erreur lors de la création du compte",
      );
    }
  }

  async checkSlugAvailability(slug: string) {
    const existing = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
    return { available: !existing };
  }

  async checkEmailAvailability(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    return { available: !existing };
  }
}
