import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { StaffService } from './staff.service';
import { Public } from '../common/decorators/public.decorator';

class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128)
  password: string;
}

/**
 * Routes publiques d'acceptation d'invitation.
 *
 * Elles doivent l'être : la personne invitée n'a pas encore de compte, c'est
 * précisément ce que l'acceptation crée. Le jeton d'invitation — 32 octets
 * aléatoires, stocké haché, à durée de vie limitée — tient lieu
 * d'authentification, et le throttling borne les tentatives de devinette.
 */
@Controller('/invites')
export class InvitesController {
  constructor(private readonly staff: StaffService) {}

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.staff.getInvitePreview(token);
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post(':token/accept')
  accept(@Param('token') token: string, @Body() body: AcceptInviteDto) {
    return this.staff.acceptInvite(token, body.name, body.password);
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post(':token/decline')
  decline(@Param('token') token: string) {
    return this.staff.declineInvite(token);
  }
}
