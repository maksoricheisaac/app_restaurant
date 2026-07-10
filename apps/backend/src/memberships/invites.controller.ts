import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Contrôleur séparé de MembershipsController : ces routes ne sont PAS
 * tenant-scopées (l'utilisateur qui accepte n'appartient pas encore au
 * tenant, donc TenantGuard/RolesGuard ne s'appliquent pas ici). L'aperçu
 * est public (avant connexion) ; accepter/refuser exige seulement d'être
 * authentifié, avec vérification que l'email du compte correspond à celui
 * de l'invitation (voir MembershipsService.acceptInvite).
 */
@Controller('/invites')
export class InvitesController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Public()
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.membershipsService.getInvitePreview(token);
  }

  @UseGuards(AuthGuard)
  @Post(':token/accept')
  accept(
    @Param('token') token: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.membershipsService.acceptInvite(token, user.id, user.email);
  }

  @UseGuards(AuthGuard)
  @Post(':token/decline')
  decline(
    @Param('token') token: string,
    @CurrentUser() user: { email: string },
  ) {
    return this.membershipsService.declineInvite(token, user.email);
  }
}
