import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const WINDOW_MS = 30 * 60 * 1000; // Fenêtres glissantes de 30 minutes

/**
 * Jeton HMAC de courte durée délivré au chargement de la carte publique et
 * exigé pour envoyer une commande ou une réservation.
 *
 * Sans slug d'établissement à signer, le jeton n'atteste plus que d'une
 * chose — et c'est tout ce qu'on lui demande : le client a bien chargé la
 * carte avant de commander, ce qui coupe court aux envois scriptés directs.
 */
@Injectable()
export class MenuSessionService {
  private readonly logger = new Logger(MenuSessionService.name);
  private readonly secret: string;
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService) {
    this.isDev = config.get<string>('NODE_ENV') !== 'production';
    const dedicated = config.get<string>('MENU_SESSION_SECRET');
    const fallback = config.get<string>('JWT_SECRET') ?? '';

    if (!dedicated && !this.isDev) {
      this.logger.warn(
        'MENU_SESSION_SECRET non défini — repli sur JWT_SECRET. ' +
          'Définissez un secret dédié en production.',
      );
    }

    this.secret = dedicated ?? fallback;
  }

  private window(): number {
    return Math.floor(Date.now() / WINDOW_MS);
  }

  private sign(win: number): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(`menu-session:${win}`)
      .digest('base64url');
  }

  /** Émet un jeton valable pour la fenêtre de 30 minutes en cours. */
  generate(): string {
    return this.sign(this.window());
  }

  /**
   * Vérifie un jeton. Accepte la fenêtre courante ET la précédente, pour ne
   * pas rejeter un client à cheval sur un changement de fenêtre.
   * En développement, renvoie toujours true : le rechargement à chaud ne doit
   * jamais bloquer une commande de test.
   */
  verify(token: string | undefined): boolean {
    if (this.isDev) return true;
    if (!token) return false;

    const w = this.window();
    return this.matches(token, w) || this.matches(token, w - 1);
  }

  private matches(token: string, win: number): boolean {
    const expected = Buffer.from(this.sign(win));
    const given = Buffer.from(token);
    // timingSafeEqual exige des longueurs égales : un jeton de taille
    // différente est de toute façon invalide, et le comparer lèverait.
    if (expected.length !== given.length) return false;
    return crypto.timingSafeEqual(expected, given);
  }
}
