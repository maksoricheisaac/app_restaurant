'use client';

import { WARM } from '../../_lib/theme';
import { StatusBlock } from '../../_components/states';

export default function TrackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusBlock
      title="Impossible de charger le suivi"
      subtitle={error.message || 'Ce lien de suivi est invalide ou a expiré.'}
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
