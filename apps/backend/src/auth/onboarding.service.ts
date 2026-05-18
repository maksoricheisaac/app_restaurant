import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InitiateRegistrationDto } from './dto/initiate-registration.dto';
import { AccountTypeDto } from './dto/account-type.dto';
import { RestaurantInfoDto } from './dto/restaurant-info.dto';
import { SelectPlanDto } from './dto/select-plan.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

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
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    return rawToken;
  }

  async initiateRegistration(dto: InitiateRegistrationDto) {
    const { firstName, lastName, email, password } = dto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    const verificationToken = crypto.randomBytes(32).toString('hex');
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
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
          onboardingStep: 1,
          onboardingCompleted: false,
        },
      });

      const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
      const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
      await this.mailService.sendEmailVerification({ to: email, name: fullName, verifyUrl });

      const access_token = this.buildAccessToken(user);
      const refresh_token = await this.issueRefreshToken(user.id);

      const { password: _pwd, onboardingData: _od, ...safeUser } = user;
      return { access_token, refresh_token, user: { ...safeUser, role: null } };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('initiateRegistration error', error instanceof Error ? error.message : String(error));
      throw new InternalServerErrorException('Erreur lors de la création du compte');
    }
  }

  async saveAccountType(userId: string, dto: AccountTypeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.onboardingCompleted) throw new BadRequestException('Onboarding déjà finalisé');

    const currentData = (user.onboardingData as Record<string, unknown>) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountType: dto.accountType,
        onboardingStep: Math.max(user.onboardingStep, 2),
        onboardingData: { ...currentData, accountType: dto.accountType },
      },
    });

    return { onboardingStep: 2 };
  }

  async saveRestaurantInfo(userId: string, dto: RestaurantInfoDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.onboardingCompleted) throw new BadRequestException('Onboarding déjà finalisé');

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existingTenant) throw new ConflictException('Ce slug est déjà utilisé');

    const currentData = (user.onboardingData as Record<string, unknown>) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: Math.max(user.onboardingStep, 3),
        onboardingData: {
          ...currentData,
          restaurantName: dto.restaurantName,
          slug: dto.slug,
          country: dto.country,
          currency: dto.currency,
          timezone: dto.timezone,
          cuisineType: dto.cuisineType ?? null,
        },
      },
    });

    return { onboardingStep: 3 };
  }

  async savePlan(userId: string, dto: SelectPlanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.onboardingCompleted) throw new BadRequestException('Onboarding déjà finalisé');

    const currentData = (user.onboardingData as Record<string, unknown>) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: Math.max(user.onboardingStep, 4),
        onboardingData: { ...currentData, plan: dto.plan },
      },
    });

    return { onboardingStep: 4 };
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Déjà terminé → retourner l'état actuel avec user pour rafraîchir le contexte frontend
    if (user.onboardingCompleted) {
      const tenant = user.tenantId
        ? await this.prisma.tenant.findUnique({ where: { id: user.tenantId } })
        : null;
      const { password: _pwd, onboardingData: _od, ...safeUser } = user;
      return { success: true, alreadyCompleted: true, tenant, user: { ...safeUser } };
    }

    const data = (user.onboardingData as Record<string, any>) ?? {};
    const accountType = user.accountType || data.accountType;

    // Multi-Manager / Franchise → pas de restaurant à créer, juste finaliser le compte
    if (accountType && accountType !== 'OWNER') {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true, onboardingStep: 5 },
      });

      const access_token = this.buildAccessToken(updatedUser);
      const refresh_token = await this.issueRefreshToken(userId);
      const { password: _pwd, onboardingData: _od, ...safeUser } = updatedUser;

      return {
        success: true,
        access_token,
        refresh_token,
        tenant: null,
        user: { ...safeUser, role: null },
      };
    }

    // Propriétaire → restaurant obligatoire
    if (!data.slug || !data.restaurantName) {
      throw new BadRequestException("Données d'onboarding incomplètes. Veuillez compléter toutes les étapes.");
    }

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existingTenant) throw new ConflictException('Ce slug est déjà utilisé');

    try {
      const { tenant, updatedUser } = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: data.restaurantName as string,
            slug: data.slug as string,
            plan: ((data.plan as string) || 'free') as any,
            status: 'active' as any,
            country: (data.country as string) || null,
            currency: (data.currency as string) || 'EUR',
            timezone: (data.timezone as string) || 'Europe/Paris',
            cuisineType: (data.cuisineType as string) || null,
            onboardingCompleted: true,
            settings: { create: { name: data.restaurantName as string } },
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
            onboardingStep: 5,
          },
        });

        return { tenant, updatedUser };
      });

      const access_token = this.buildAccessToken({ ...updatedUser, tenantId: tenant.id });
      const refresh_token = await this.issueRefreshToken(userId);

      const { password: _pwd, onboardingData: _od, ...safeUser } = updatedUser;
      return {
        success: true,
        access_token,
        refresh_token,
        tenant,
        user: { ...safeUser, tenantId: tenant.id, role: 'owner' },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      this.logger.error('completeOnboarding error', error instanceof Error ? error.message : String(error));
      throw new InternalServerErrorException('Erreur lors de la finalisation');
    }
  }

  async getOnboardingState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStep: true,
        onboardingCompleted: true,
        onboardingData: true,
        accountType: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async checkSlugAvailability(slug: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    return { available: !existing };
  }
}
