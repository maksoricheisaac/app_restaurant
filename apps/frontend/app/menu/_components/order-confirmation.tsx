'use client';

import { CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WARM, withAlpha } from '../_lib/theme';

/** Écran de confirmation : QR de suivi, référence, CTA suivre / continuer. */
export function OrderConfirmation({
  orderId,
  color,
  onBrand,
  isDineIn,
  onNewOrder,
}: {
  orderId: string;
  color: string;
  onBrand: string;
  isDineIn: boolean;
  onNewOrder: () => void;
}) {
  const trackingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/menu/track/${orderId}`
      : `/menu/track/${orderId}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6" style={{ backgroundColor: WARM.page }}>
      <div className="mx-auto w-full max-w-sm space-y-5">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <div>
            <h1 className="font-display text-3xl" style={{ color: WARM.ink }}>
              Commande envoyée !
            </h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: WARM.muted }}>
              {isDineIn
                ? 'Le restaurant prépare votre commande. Suivez son avancement en temps réel.'
                : 'Scannez le QR code ou suivez le lien pour suivre votre commande.'}
            </p>
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-4 rounded-3xl p-6 shadow-sm"
          style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
        >
          <div className="rounded-2xl p-3" style={{ backgroundColor: WARM.surface }}>
            <div style={{ width: 'min(180px, 60vw)', height: 'min(180px, 60vw)' }}>
              <QRCodeSVG
                value={trackingUrl}
                size={180}
                fgColor={WARM.ink}
                bgColor="transparent"
                level="M"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: WARM.faint }}>
              Référence commande
            </p>
            <p className="mt-0.5 font-mono text-base font-bold tracking-widest" style={{ color: WARM.ink }}>
              #{orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <a
          href={trackingUrl}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: color, color: onBrand, boxShadow: `0 8px 24px ${withAlpha(color, 0.28)}` }}
        >
          <Sparkles className="h-4 w-4" />
          Suivre ma commande
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onNewOrder}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: WARM.card, borderColor: WARM.borderStrong, color: WARM.inkSoft }}
          >
            Commander autre chose
          </button>
          <a
            href={'/menu'}
            className="flex-1 rounded-xl border py-3 text-center text-sm font-semibold transition-colors"
            style={{ backgroundColor: WARM.card, borderColor: WARM.borderStrong, color: WARM.inkSoft }}
          >
            Retour au menu
          </a>
        </div>
      </div>
    </div>
  );
}
