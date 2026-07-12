"use client";

import { useEffect } from "react";

import { monitoring } from "@/lib/monitoring";
import { ErrorState } from "@/components/customs/public/error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureError(error, { context: "app-root" });
  }, [error]);

  return (
    <ErrorState
      icon="alert"
      title="Une erreur est survenue"
      message={error.message || "Quelque chose s'est mal passé de notre côté. Réessayez, ou revenez à l'accueil."}
      onRetry={reset}
    />
  );
}
