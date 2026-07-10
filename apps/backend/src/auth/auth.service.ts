import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const MAX_REFRESH_TOKENS_PER_USER = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { tenant: true } } },
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      return null;
    }

    // Ne pas vérifier emailVerified ici (contexte Passport) :
    // une exception lancée dans validate() peut remonter en 500.
    // La vérification se fait dans login() après que Passport a validé les credentials.
    const { password: _password, ...result } = user;
    return result;
  }

  async login(user: any) {
    // Vérification email après authentification Passport (HTTP 401 propre)
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Veuillez vérifier votre adresse email avant de vous connecter.',
      );
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.memberships?.[0]?.role || user.platformRole,
      platformRole: user.platformRole,
      tenantId: user.tenantId || user.memberships?.[0]?.tenantId,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = await this.issueRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.memberships?.[0]?.role,
        platformRole: user.platformRole,
        tenantId: user.tenantId,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }

  async issueRefreshToken(userId: string): Promise<string> {
    // Keep only the most recent MAX_REFRESH_TOKENS_PER_USER tokens
    const existing = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (existing.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const toDelete = existing.slice(
        0,
        existing.length - MAX_REFRESH_TOKENS_PER_USER + 1,
      );
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
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return rawToken;
  }

  async refreshAccessToken(rawToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { memberships: { include: { tenant: true } } } },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored)
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // ── Reuse detection ──────────────────────────────────────────────────────
    // Si usedAt est déjà défini, ce token a DÉJÀ été consommé.
    // Cela indique une possible attaque replay : un attaquant a obtenu un
    // refresh token et tente de l'utiliser après qu'il ait été rotaté.
    // Réponse défensive : révoquer TOUTES les sessions de cet utilisateur.

    if (stored.usedAt != null) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: stored.userId },
      });
      throw new UnauthorizedException(
        'Session compromise détectée. Veuillez vous reconnecter.',
      );
    }

    // Marquer comme utilisé avant de continuer (protection contre les race conditions)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    // Rotate: delete old token, issue new one
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const newRawToken = await this.issueRefreshToken(stored.userId);

    const user = stored.user;
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.memberships?.[0]?.role || user.platformRole,
      platformRole: user.platformRole,
      tenantId: user.tenantId || user.memberships?.[0]?.tenantId,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token, refresh_token: newRawToken };
  }

  async revokeRefreshToken(rawToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    await this.prisma.refreshToken
      .deleteMany({ where: { tokenHash } })
      .catch(() => null);
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Lien de vérification invalide ou expiré',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { message: 'Email vérifié avec succès' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        phone: true,
        status: true,
        platformRole: true,
        tenantId: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        memberships: {
          select: { role: true, tenantId: true },
          orderBy: { createdAt: 'asc' as const },
          take: 1,
        },
      },
    });
    if (!user) return null;
    const { memberships, ...rest } = user;
    return {
      ...rest,
      // Mirror the login response: fall back to membership tenantId when the
      // User.tenantId column is null (e.g. multi-manager / franchise accounts
      // whose primary tenant link lives only in TenantMembership).
      tenantId: rest.tenantId ?? memberships?.[0]?.tenantId ?? null,
      role: memberships?.[0]?.role ?? null,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user)
      return {
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: tokenHash, passwordResetExpiry: expiry },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordReset({
      to: email,
      name: user.name,
      resetUrl,
    });

    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Lien de réinitialisation invalide ou expiré.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Revoke all existing refresh tokens for security
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always same response to prevent user enumeration.
    const msg = {
      message:
        "Si cet email existe et n'est pas encore vérifié, un lien a été envoyé.",
    };
    if (!user || user.emailVerified) return msg;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${rawToken}`;
    await this.mailService.sendEmailVerification({
      to: email,
      name: user.name,
      verifyUrl,
    });

    return msg;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        status: true,
        createdAt: true,
        image: true,
      },
    });
  }

  async updateUserPlatformRole(userId: string, platformRole: string) {
    const valid = ['user', 'support', 'super_admin'];
    if (!valid.includes(platformRole))
      throw new BadRequestException('Rôle invalide');
    return this.prisma.user.update({
      where: { id: userId },
      data: { platformRole: platformRole as any },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        status: true,
      },
    });
  }

  async updateUserStatus(userId: string, status: string) {
    const valid = ['active', 'inactive'];
    if (!valid.includes(status))
      throw new BadRequestException('Statut invalide');
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        status: true,
      },
    });
  }
}
