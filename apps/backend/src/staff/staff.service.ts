import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import {
  StaffRole,
  isSuperAdmin,
} from '../common/constants/staff-roles.constant';
import {
  CreateStaffDto,
  UpdateStaffDto,
  InviteStaffDto,
} from './dto/staff.dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/** Ne jamais renvoyer tokenHash au client — c'est un secret interne. */
const INVITE_SAFE_SELECT = {
  id: true,
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

const STAFF_SELECT = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

/**
 * Gestion de l'équipe : membres, rôles, invitations, transfert de propriété.
 *
 * Fusionne les deux services qui se partageaient autrefois ce périmètre
 * (MembershipsService et la moitié « personnel » de PermissionsService). Le
 * membre d'équipe EST le compte utilisateur : il n'y a plus de table de
 * liaison, donc plus de double source de vérité sur le rôle.
 */
@Injectable()
export class StaffService {
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private restaurant: RestaurantService,
    private config: ConfigService,
  ) {
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4000';
  }

  // ─── Membres ──────────────────────────────────────────────────────────────

  findAll() {
    return this.prisma.user.findMany({
      select: STAFF_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException(
        'Un compte existe déjà avec cette adresse email.',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: data.role,
        // Compte créé par un responsable depuis l'administration : l'adresse
        // n'a pas besoin d'être confirmée par un lien.
        emailVerified: true,
      },
      select: STAFF_SELECT,
    });
  }

  async update(id: string, data: UpdateStaffDto, currentUserId: string) {
    const member = await this.assertModifiable(id, currentUserId);

    if (data.email && data.email !== member.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (clash) {
        throw new ConflictException(
          'Un compte existe déjà avec cette adresse email.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: STAFF_SELECT,
    });
  }

  async remove(id: string, currentUserId: string) {
    await this.assertModifiable(id, currentUserId);

    // Les FK de Payment / Transaction / CashRegisterSession sont en RESTRICT :
    // un employé qui a encaissé ne peut pas être effacé sans emporter son
    // historique comptable. On le désactive alors au lieu de le supprimer.
    const hasFinancialHistory = await this.hasFinancialHistory(id);
    if (hasFinancialHistory) {
      return this.prisma.user.update({
        where: { id },
        data: { status: 'inactive' },
        select: STAFF_SELECT,
      });
    }

    return this.prisma.user.delete({ where: { id }, select: STAFF_SELECT });
  }

  private async hasFinancialHistory(userId: string): Promise<boolean> {
    const [payments, transactions, sessions] = await Promise.all([
      this.prisma.payment.count({ where: { cashierId: userId } }),
      this.prisma.transaction.count({ where: { cashierId: userId } }),
      this.prisma.cashRegisterSession.count({
        where: { OR: [{ openedBy: userId }, { closedBy: userId }] },
      }),
    ]);
    return payments + transactions + sessions > 0;
  }

  private async assertModifiable(id: string, currentUserId: string) {
    const member = await this.prisma.user.findUnique({ where: { id } });
    if (!member) throw new NotFoundException("Membre d'équipe introuvable");

    if (member.id === currentUserId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier votre propre compte depuis la gestion d’équipe.',
      );
    }

    if (isSuperAdmin(member.role)) {
      throw new ForbiddenException(
        'Le super administrateur ne peut être ni modifié, ni désactivé, ni supprimé depuis la gestion d’équipe.',
      );
    }

    if (member.role === StaffRole.OWNER) {
      throw new ForbiddenException(
        'Le propriétaire ne peut être modifié que par le transfert de propriété.',
      );
    }

    return member;
  }

  /**
   * Attribue la propriété de l'établissement, atomiquement : le propriétaire
   * sortant — s'il y en a un — redevient manager, la cible devient
   * propriétaire. C'est le seul moyen d'attribuer le rôle « owner », ce qui
   * garantit qu'il y en a toujours au plus un.
   *
   * Deux appelants légitimes, aux intentions différentes :
   *  - le **propriétaire** transfère sa propre propriété et se rétrograde ;
   *  - le **super administrateur** désigne un propriétaire sans rien céder.
   *    C'est ce qui débloque l'installation initiale, où le compte racine est
   *    d'abord seul, et la reprise après le départ d'un propriétaire.
   */
  transferOwnership(currentUserId: string, targetUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const caller = await tx.user.findUnique({ where: { id: currentUserId } });
      const callerIsOwner = caller?.role === StaffRole.OWNER;
      const callerIsRoot = isSuperAdmin(caller?.role);

      if (!caller || (!callerIsOwner && !callerIsRoot)) {
        throw new ForbiddenException(
          'Seuls le propriétaire actuel et le super administrateur peuvent désigner un propriétaire.',
        );
      }

      if (targetUserId === currentUserId) {
        throw new ConflictException(
          callerIsRoot
            ? 'Le super administrateur ne peut pas devenir propriétaire : il perdrait son rôle racine.'
            : 'Vous êtes déjà le propriétaire.',
        );
      }

      const target = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!target) throw new NotFoundException("Membre d'équipe introuvable");
      if (isSuperAdmin(target.role)) {
        throw new ConflictException(
          'Le super administrateur ne peut pas changer de rôle.',
        );
      }
      if (target.status !== 'active') {
        throw new ConflictException(
          'La propriété ne peut être transférée qu’à un compte actif.',
        );
      }

      // Recherché par rôle et non par identité de l'appelant : quand c'est le
      // compte racine qui désigne, le propriétaire sortant est quelqu'un
      // d'autre — et il peut n'y en avoir aucun.
      const currentOwner = await tx.user.findFirst({
        where: { role: StaffRole.OWNER },
      });

      if (currentOwner) {
        await tx.user.update({
          where: { id: currentOwner.id },
          data: { role: StaffRole.MANAGER },
        });
      }

      return tx.user.update({
        where: { id: target.id },
        data: { role: StaffRole.OWNER },
        select: STAFF_SELECT,
      });
    });
  }

  // ─── Invitations ──────────────────────────────────────────────────────────

  /**
   * Invite une adresse email à rejoindre l'équipe.
   * - Compte déjà existant : impossible, le compte a déjà un rôle ici.
   * - Sinon : crée une invitation à jeton expirant et envoie le lien.
   */
  async invite(invitedByUserId: string, dto: InviteStaffDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Cette personne fait déjà partie de l’équipe.',
      );
    }

    const existingPending = await this.prisma.staffInvite.findFirst({
      where: { email: dto.email, status: 'pending' },
    });
    if (existingPending) {
      throw new ConflictException(
        'Une invitation est déjà en attente pour cet email.',
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.staffInvite.create({
      data: {
        email: dto.email,
        role: dto.role,
        tokenHash: hashToken(rawToken),
        invitedBy: invitedByUserId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: INVITE_SAFE_SELECT,
    });

    await this.sendInviteEmail(dto.email, dto.role, invitedByUserId, rawToken);

    return invite;
  }

  private async sendInviteEmail(
    to: string,
    role: string,
    inviterId: string,
    rawToken: string,
  ) {
    const [restaurant, inviter] = await Promise.all([
      this.restaurant.getPublicProfile().catch(() => null),
      this.prisma.user.findUnique({
        where: { id: inviterId },
        select: { name: true },
      }),
    ]);

    // Best-effort : l'invitation reste créée même si l'email n'part pas.
    void this.mailService.sendStaffInvite({
      to,
      restaurantName: restaurant?.name ?? 'Le restaurant',
      inviterName: inviter?.name ?? 'Un responsable',
      role,
      acceptUrl: `${this.frontendUrl}/invite/accept/${rawToken}`,
    });
  }

  listInvites() {
    return this.prisma.staffInvite.findMany({
      where: { status: 'pending' },
      select: INVITE_SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(inviteId: string) {
    const invite = await this.getPendingInvite(inviteId);

    return this.prisma.staffInvite.update({
      where: { id: invite.id },
      data: { status: 'revoked' },
      select: INVITE_SAFE_SELECT,
    });
  }

  async resendInvite(inviteId: string) {
    const invite = await this.getPendingInvite(inviteId);

    // Nouveau jeton + expiration repoussée — l'ancien lien devient invalide.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const updated = await this.prisma.staffInvite.update({
      where: { id: invite.id },
      data: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: INVITE_SAFE_SELECT,
    });

    await this.sendInviteEmail(
      invite.email,
      invite.role,
      invite.invitedBy,
      rawToken,
    );

    return updated;
  }

  private async getPendingInvite(inviteId: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.status !== 'pending') {
      throw new ConflictException("Cette invitation n'est plus en attente.");
    }
    return invite;
  }

  /** Aperçu public d'une invitation (page d'acceptation, avant connexion). */
  async getInvitePreview(rawToken: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      select: { email: true, role: true, status: true, expiresAt: true },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');

    const restaurant = await this.restaurant
      .getPublicProfile()
      .catch(() => null);

    const expired =
      invite.status === 'pending' && invite.expiresAt < new Date();

    return {
      email: invite.email,
      role: invite.role,
      restaurantName: restaurant?.name ?? null,
      restaurantLogo: restaurant?.logo ?? null,
      valid: invite.status === 'pending' && !expired,
      status: expired ? 'expired' : invite.status,
    };
  }

  /**
   * Accepte une invitation en créant le compte de l'employé. C'est le seul
   * chemin d'inscription du logiciel : il n'existe plus d'inscription
   * publique, seulement des personnes invitées par l'équipe en place.
   */
  async acceptInvite(rawToken: string, name: string, password: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');

    if (invite.status !== 'pending') {
      throw new ConflictException(
        `Cette invitation n'est plus valide (statut : ${invite.status}).`,
      );
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.staffInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new ConflictException('Cette invitation a expiré.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      await this.prisma.staffInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      throw new ConflictException('Un compte existe déjà pour cette adresse.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: invite.email,
          password: hashedPassword,
          role: invite.role,
          emailVerified: true,
        },
        select: STAFF_SELECT,
      });

      await tx.staffInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });

      return user;
    });
  }

  async declineInvite(rawToken: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.status !== 'pending') {
      throw new ConflictException("Cette invitation n'est plus en attente.");
    }

    return this.prisma.staffInvite.update({
      where: { id: invite.id },
      data: { status: 'declined' },
      select: INVITE_SAFE_SELECT,
    });
  }
}
