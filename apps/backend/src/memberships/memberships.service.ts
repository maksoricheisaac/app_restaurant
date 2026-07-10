import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import { MailService } from '../mail/mail.service';
import { TenantRole } from '../common/constants/tenant-roles.constant';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Ne jamais renvoyer tokenHash au client — c'est un secret interne.
const INVITE_SAFE_SELECT = {
  id: true,
  tenantId: true,
  email: true,
  role: true,
  status: true,
  invitedBy: true,
  expiresAt: true,
  acceptedAt: true,
  createdAt: true,
  updatedAt: true,
  invitedByUser: { select: { id: true, name: true } },
} as const;

@Injectable()
export class MembershipsService {
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
    private mailService: MailService,
    private config: ConfigService,
  ) {
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
  }

  async findByTenant(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { userId },
      include: { tenant: true },
    });
  }

  /**
   * Invite un email à rejoindre le tenant.
   * - Si un compte existe déjà pour cet email : ajout immédiat (chemin
   *   historique, inchangé) + email de notification.
   * - Sinon : crée une MembershipInvite avec jeton à expiration et envoie
   *   un email d'invitation avec lien d'acceptation.
   */
  async invite(
    tenantId: string,
    invitedByUserId: string,
    email: string,
    role: string,
  ) {
    await this.planLimitService.assertStaffMemberLimit(tenantId);

    const [user, tenant, inviter] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: invitedByUserId },
        select: { name: true },
      }),
    ]);
    const restaurantName = tenant?.name ?? 'Flash Menu';
    const inviterName = inviter?.name ?? 'Un administrateur';

    if (user) {
      const existingMembership = await this.prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId } },
      });
      if (existingMembership) {
        throw new ConflictException(
          'Cet utilisateur est déjà membre de ce restaurant.',
        );
      }

      const membership = await this.prisma.tenantMembership.create({
        data: { tenantId, userId: user.id, role },
      });

      // Best-effort : la création de membership réussit même si l'email échoue.
      void this.mailService.sendMembershipInvite({
        to: user.email,
        restaurantName,
        inviterName,
        role,
        acceptUrl: `${this.frontendUrl}/admin/dashboard`,
      });

      return membership;
    }

    const existingPending = await this.prisma.membershipInvite.findFirst({
      where: { tenantId, email, status: 'pending' },
    });
    if (existingPending) {
      throw new ConflictException(
        'Une invitation est déjà en attente pour cet email.',
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.membershipInvite.create({
      data: {
        tenantId,
        email,
        role,
        tokenHash: hashToken(rawToken),
        invitedBy: invitedByUserId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: INVITE_SAFE_SELECT,
    });

    void this.mailService.sendMembershipInvite({
      to: email,
      restaurantName,
      inviterName,
      role,
      acceptUrl: `${this.frontendUrl}/invite/accept/${rawToken}`,
    });

    return invite;
  }

  async listInvites(tenantId: string) {
    return this.prisma.membershipInvite.findMany({
      where: { tenantId, status: 'pending' },
      select: INVITE_SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(tenantId: string, inviteId: string) {
    const invite = await this.prisma.membershipInvite.findFirst({
      where: { id: inviteId, tenantId },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.status !== 'pending') {
      throw new ConflictException(
        'Seule une invitation en attente peut être révoquée.',
      );
    }

    return this.prisma.membershipInvite.update({
      where: { id: inviteId },
      data: { status: 'revoked' },
      select: INVITE_SAFE_SELECT,
    });
  }

  async resendInvite(tenantId: string, inviteId: string) {
    const invite = await this.prisma.membershipInvite.findFirst({
      where: { id: inviteId, tenantId },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.status !== 'pending') {
      throw new ConflictException(
        'Seule une invitation en attente peut être relancée.',
      );
    }

    const [tenant, inviter] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: invite.invitedBy },
        select: { name: true },
      }),
    ]);

    // Nouveau jeton + expiration repoussée — l'ancien lien devient invalide.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const updated = await this.prisma.membershipInvite.update({
      where: { id: inviteId },
      data: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: INVITE_SAFE_SELECT,
    });

    void this.mailService.sendMembershipInvite({
      to: invite.email,
      restaurantName: tenant?.name ?? 'Flash Menu',
      inviterName: inviter?.name ?? 'Un administrateur',
      role: invite.role,
      acceptUrl: `${this.frontendUrl}/invite/accept/${rawToken}`,
    });

    return updated;
  }

  /** Aperçu public d'une invitation (page d'acceptation, avant connexion). */
  async getInvitePreview(rawToken: string) {
    const invite = await this.prisma.membershipInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      select: {
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        tenant: { select: { name: true, logo: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');

    const expired =
      invite.status === 'pending' && invite.expiresAt < new Date();

    return {
      email: invite.email,
      role: invite.role,
      restaurantName: invite.tenant.name,
      restaurantLogo: invite.tenant.logo,
      valid: invite.status === 'pending' && !expired,
      status: expired ? 'expired' : invite.status,
    };
  }

  async acceptInvite(
    rawToken: string,
    currentUserId: string,
    currentUserEmail: string,
  ) {
    const invite = await this.prisma.membershipInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');

    if (invite.status !== 'pending') {
      throw new ConflictException(
        `Cette invitation n'est plus valide (statut: ${invite.status}).`,
      );
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.membershipInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new ConflictException('Cette invitation a expiré.');
    }
    if (invite.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation a été envoyée à une autre adresse email. Connectez-vous avec le compte correspondant.',
      );
    }

    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: { userId: currentUserId, tenantId: invite.tenantId },
      },
    });
    if (existingMembership) {
      await this.prisma.membershipInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      throw new ConflictException('Vous êtes déjà membre de ce restaurant.');
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: invite.tenantId,
          userId: currentUserId,
          role: invite.role,
        },
      });
      await tx.membershipInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      return membership;
    });
  }

  async declineInvite(rawToken: string, currentUserEmail: string) {
    const invite = await this.prisma.membershipInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.status !== 'pending') {
      throw new ConflictException("Cette invitation n'est plus en attente.");
    }
    if (invite.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation a été envoyée à une autre adresse email.',
      );
    }

    return this.prisma.membershipInvite.update({
      where: { id: invite.id },
      data: { status: 'declined' },
      select: INVITE_SAFE_SELECT,
    });
  }

  async updateRole(
    id: string,
    tenantId: string,
    role: string,
    currentUserId: string,
  ) {
    // Verify membership belongs to caller's tenant before updating (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot change the role of your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner role can only change via the ownership transfer flow',
      );
    }

    return this.prisma.tenantMembership.update({
      where: { id },
      data: { role },
    });
  }

  async remove(id: string, tenantId: string, currentUserId: string) {
    // Verify membership belongs to caller's tenant before deleting (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot remove your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner cannot be removed via membership management',
      );
    }

    return this.prisma.tenantMembership.delete({
      where: { id },
    });
  }

  /**
   * Transfers tenant ownership from the current owner to another member,
   * atomically: the current owner is demoted to "manager" and the target
   * member is promoted to "owner". This is the only way "owner" can be
   * assigned, keeping exactly one owner per tenant at all times.
   */
  async transferOwnership(
    tenantId: string,
    currentUserId: string,
    targetMembershipId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const currentOwnerMembership = await tx.tenantMembership.findFirst({
        where: { tenantId, userId: currentUserId, role: TenantRole.OWNER },
      });
      if (!currentOwnerMembership) {
        throw new ForbiddenException(
          'Only the current tenant owner can transfer ownership',
        );
      }

      const targetMembership = await tx.tenantMembership.findFirst({
        where: { id: targetMembershipId, tenantId },
      });
      if (!targetMembership) {
        throw new NotFoundException('Target membership not found');
      }

      if (targetMembership.id === currentOwnerMembership.id) {
        throw new ConflictException('You are already the tenant owner');
      }

      await tx.tenantMembership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: TenantRole.MANAGER },
      });

      return tx.tenantMembership.update({
        where: { id: targetMembership.id },
        data: { role: TenantRole.OWNER },
      });
    });
  }
}
