"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { monitoring } from "@/lib/monitoring";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureError(error, { context: "super-admin" });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center gap-5">
      <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800">Une erreur est survenue</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {error.message || "Impossible de charger cette page d'administration plateforme."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/super-admin/dashboard"
          className="px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
