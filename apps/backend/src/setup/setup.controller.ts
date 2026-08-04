import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { SetupService } from './setup.service';
import { AuthService } from '../auth/auth.service';
import { CompleteSetupDto } from './dto/setup.dto';
import { AllowDuringSetup, OnlyDuringSetup } from './setup.decorators';
import { Public } from '../common/decorators/public.decorator';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Assistant de première installation.
 *
 * Les deux routes sont publiques par nécessité : au premier lancement, aucun
 * compte n'existe encore. Trois protections se superposent :
 *
 * - `@Public()` lève l'exigence d'authentification, que rien ne pourrait
 *   satisfaire sur une base vide ;
 * - `@OnlyDuringSetup()` fait répondre 403 au garde global dès l'installation
 *   terminée, sans jamais atteindre ce contrôleur ;
 * - `@Throttle` borne les tentatives avant même que la contrainte d'unicité de
 *   `Restaurant` n'ait à trancher.
 */
@Controller('setup')
export class SetupController {
  constructor(
    private readonly setup: SetupService,
    private readonly auth: AuthService,
  ) {}

  /**
   * État de l'installation. Reste accessible après l'installation : le
   * frontend l'interroge à chaque rendu serveur pour savoir s'il doit router
   * vers l'assistant ou vers la connexion.
   */
  @Public()
  @AllowDuringSetup()
  @Get('status')
  getStatus() {
    return this.setup.getStatus();
  }

  /**
   * Installe le logiciel et connecte le propriétaire dans la foulée.
   *
   * Réponse 403 `SETUP_ALREADY_COMPLETED` si le logiciel est déjà installé,
   * 409 si deux installations se croisent, 400 si la charge utile est invalide.
   */
  @Public()
  @OnlyDuringSetup()
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 10, ttl: 60_000 * 60 },
  })
  @Post()
  async complete(
    @Body() dto: CompleteSetupDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.setup.complete(dto, {
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as express.Request & { requestId?: string }).requestId,
    });

    // L'installation vaut connexion : le super administrateur enchaîne
    // directement sur le tableau de bord, sans repasser par le formulaire de
    // connexion.
    //
    // Les jetons partent en cookies `httpOnly` et non dans le corps de la
    // réponse : un jeton lisible par JavaScript est un jeton exfiltrable par la
    // première faille XSS venue. Le corps ne contient donc aucun secret.
    const access_token = await this.auth.issueAccessTokenFor(
      result.superAdmin.id,
    );
    const refresh_token = await this.auth.issueRefreshToken(
      result.superAdmin.id,
    );

    res.cookie('token', access_token, {
      ...COOKIE_OPTS_BASE,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie('refreshToken', refresh_token, {
      ...COOKIE_OPTS_BASE,
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return {
      restaurant: result.restaurant,
      user: result.superAdmin,
      recovery: result.isRecovery,
    };
  }
}
