import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { SetupService } from './setup.service';
import { AuthService } from '../auth/auth.service';
import { CompleteSetupDto } from './dto/setup.dto';
import { Public } from '../common/decorators/public.decorator';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

/**
 * Assistant de première installation.
 *
 * Les deux routes sont publiques par nécessité : au premier lancement, aucun
 * compte n'existe encore. `POST /setup` ne peut réussir qu'une seule fois —
 * la contrainte d'unicité de la table `Restaurant` s'en charge — et le
 * throttling limite le bruit avant que cette contrainte ne s'applique.
 */
@Controller('setup')
export class SetupController {
  constructor(
    private readonly setup: SetupService,
    private readonly auth: AuthService,
  ) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.setup.getStatus();
  }

  @Public()
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 10, ttl: 60_000 * 60 },
  })
  @Post()
  async complete(
    @Body() dto: CompleteSetupDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.setup.complete(dto);

    // L'installation vaut connexion : le propriétaire enchaîne directement sur
    // le tableau de bord, sans repasser par le formulaire de connexion.
    const access_token = await this.auth.issueAccessTokenFor(result.owner.id);
    const refresh_token = await this.auth.issueRefreshToken(result.owner.id);

    res.cookie('token', access_token, {
      ...COOKIE_OPTS_BASE,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refresh_token, {
      ...COOKIE_OPTS_BASE,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { restaurant: result.restaurant, user: result.owner };
  }
}
