"use client";

import { UtensilsCrossed } from "lucide-react";

export default function TrackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f5f4f1] flex flex-col items-center justify-center p-8 text-center gap-5">
      <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center shadow-sm">
        <UtensilsCrossed className="h-9 w-9 text-slate-300" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800">Impossible de charger le suivi</p>
        <p className="text-sm text-slate-400 mt-1">
          {error.message || "Ce lien de suivi est invalide ou a expiré."}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
