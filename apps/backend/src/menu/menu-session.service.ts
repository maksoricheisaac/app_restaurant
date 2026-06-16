import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const WINDOW_MS = 30 * 60 * 1000; // 30-minute rolling windows

@Injectable()
export class MenuSessionService {
  private readonly logger = new Logger(MenuSessionService.name);
  private readonly secret: string;
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService) {
    this.isDev = config.get<string>('NODE_ENV') !== 'production';
    const dedicated = config.get<string>('MENU_SESSION_SECRET');
    const fallback  = config.get<string>('JWT_SECRET') ?? '';

    if (!dedicated && !this.isDev) {
      this.logger.warn(
        'MENU_SESSION_SECRET not set — falling back to JWT_SECRET. ' +
        'Set a dedicated secret in production.',
      );
    }

    this.secret = dedicated ?? fallback;
  }

  private window(): number {
    return Math.floor(Date.now() / WINDOW_MS);
  }

  private sign(slug: string, win: number): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(`menu-session:${slug}:${win}`)
      .digest('base64url');
  }

  /** Generate a token valid for the current 30-minute window. */
  generate(slug: string): string {
    return this.sign(slug, this.window());
  }

  /**
   * Verify a token for `slug`.
   * Accepts current window AND previous window (handles boundary edge-cases).
   * In development, always returns true so hot-reloading never blocks orders.
   */
  verify(slug: string, token: string | undefined): boolean {
    if (this.isDev) return true;
    if (!token) return false;
    const w = this.window();
    return (
      crypto.timingSafeEqual(
        Buffer.from(this.sign(slug, w)),
        Buffer.from(token),
      ) ||
      crypto.timingSafeEqual(
        Buffer.from(this.sign(slug, w - 1)),
        Buffer.from(token),
      )
    );
  }
}
