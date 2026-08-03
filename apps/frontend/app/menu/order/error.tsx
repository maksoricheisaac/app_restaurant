'use client';

import { WARM } from '../_lib/theme';
import { StatusBlock } from '../_components/states';

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusBlock
      title="Une erreur est survenue"
      subtitle={error.message || 'Impossible de charger la commande.'}
      action={
        <button
          onClick={reset}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: WARM.ink }}
        >
          Réessayer
        </button>
      }
    />
  );
}
