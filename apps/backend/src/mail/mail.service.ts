import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  private readonly frontendUrl: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    this.from = this.config.get<string>('SMTP_FROM') ?? 'Flash Menu <noreply@flashmenu.app>';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    if (host && user && !user.includes('votre@')) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: false,
        auth: {
          user,
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (SMTP not configured): ${subject} → ${to}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent: ${subject} → ${to}`);
    } catch (err) {
      this.logger.error(`Email failed: ${subject} → ${to}`, err);
    }
  }

  async sendEmailVerification(opts: { to: string; name: string; verifyUrl: string }) {
    if (!this.transporter) {
      // In development, log the link so the developer can verify manually
      this.logger.warn(`[DEV] Email verification link for ${opts.to}: ${opts.verifyUrl}`);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Vérification de votre email</title></head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <div style="background:#f97316;padding:32px 40px">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">⚡ Flash Menu</h1>
          </div>
          <div style="padding:40px">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">Bonjour ${opts.name},</h2>
            <p style="color:#64748b;margin:0 0 28px;line-height:1.6">
              Merci de vous être inscrit sur Flash Menu. Cliquez sur le bouton ci-dessous pour vérifier votre email et activer votre compte.
            </p>
            <a href="${opts.verifyUrl}"
               style="display:inline-block;background:#f97316;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
              Vérifier mon email →
            </a>
            <p style="color:#94a3b8;font-size:12px;margin:28px 0 0">
              Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
          </div>
        </div>
      </body>
      </html>`;

    await this.send(opts.to, 'Vérifiez votre email — Flash Menu', html);
  }

  async sendPasswordReset(opts: { to: string; name: string; resetUrl: string }) {
    if (!this.transporter) {
      this.logger.warn(`[DEV] Password reset link for ${opts.to}: ${opts.resetUrl}`);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Réinitialisation de mot de passe</title></head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <div style="background:#f97316;padding:32px 40px">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">⚡ Flash Menu</h1>
          </div>
          <div style="padding:40px">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">Bonjour ${opts.name},</h2>
            <p style="color:#64748b;margin:0 0 28px;line-height:1.6">
              Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
            </p>
            <a href="${opts.resetUrl}"
               style="display:inline-block;background:#f97316;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
              Réinitialiser mon mot de passe →
            </a>
            <p style="color:#94a3b8;font-size:12px;margin:28px 0 0">
              Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
            </p>
          </div>
        </div>
      </body>
      </html>`;

    await this.send(opts.to, 'Réinitialisation de mot de passe — Flash Menu', html);
  }

  async sendOrderConfirmation(opts: {
    to: string;
    restaurantName: string;
    orderId: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    type: string;
  }) {
    const typeLabel: Record<string, string> = {
      dine_in: 'Sur place',
      takeaway: 'À emporter',
      delivery: 'Livraison',
    };
    const itemsHtml = opts.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${i.quantity}× ${i.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600">
              ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(i.price * i.quantity)}
            </td>
          </tr>`,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Confirmation de commande</title></head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <div style="background:#f97316;padding:32px 40px">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">⚡ Flash Menu</h1>
            <p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:14px">Confirmation de commande</p>
          </div>
          <div style="padding:40px">
            <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">Votre commande est enregistrée ✅</h2>
            <p style="color:#64748b;margin:0 0 24px">
              <strong>${opts.restaurantName}</strong> a bien reçu votre commande (${typeLabel[opts.type] ?? opts.type}).
            </p>
            <table style="width:100%;border-collapse:collapse">
              ${itemsHtml}
              <tr>
                <td style="padding:16px 0 0;font-size:16px;font-weight:800;color:#0f172a">Total</td>
                <td style="padding:16px 0 0;text-align:right;font-size:16px;font-weight:800;color:#f97316">
                  ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(opts.total)}
                </td>
              </tr>
            </table>
            <div style="margin:32px 0;padding:16px;background:#fff7ed;border-radius:12px;border-left:4px solid #f97316">
              <p style="margin:0;font-size:13px;color:#92400e">Référence : <strong>${opts.orderId.slice(-8).toUpperCase()}</strong></p>
            </div>
          </div>
          <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              Propulsé par <strong style="color:#f97316">Flash Menu</strong>
            </p>
          </div>
        </div>
      </body>
      </html>`;

    await this.send(opts.to, `Votre commande chez ${opts.restaurantName}`, html);
  }

  async sendNewOrderAlert(opts: {
    to: string;
    restaurantName: string;
    orderId: string;
    total: number;
    type: string;
    tableNumber?: number;
  }) {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <div style="background:#0f172a;padding:32px 40px">
            <h1 style="color:#f97316;margin:0;font-size:24px;font-weight:800">🔔 Nouvelle commande !</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#0f172a;font-size:18px;font-weight:700;margin:0 0 16px">
              ${opts.tableNumber ? `Table ${opts.tableNumber}` : opts.type === 'takeaway' ? 'À emporter' : 'Livraison'}
            </p>
            <p style="color:#64748b;margin:0 0 24px">
              Total : <strong style="color:#f97316;font-size:20px">
                ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(opts.total)}
              </strong>
            </p>
            <p style="color:#94a3b8;font-size:13px">Réf. ${opts.orderId.slice(-8).toUpperCase()}</p>
            <a href="${this.frontendUrl}/admin/orders"
               style="display:inline-block;margin-top:16px;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
              Voir la commande →
            </a>
          </div>
        </div>
      </body>
      </html>`;

    await this.send(opts.to, `🔔 Nouvelle commande — ${opts.restaurantName}`, html);
  }
}
