"use client";

import { useEffect } from "react";

import { monitoring } from "@/lib/monitoring";
import { ErrorState } from "@/components/customs/public/error-state";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureError(error, { context: "auth" });
  }, [error]);

  return (
    <ErrorState
      icon="alert"
      title="Une erreur est survenue"
      message={error.message || "Impossible de charger cette page de connexion. Réessayez dans un instant."}
      onRetry={reset}
      primaryHref="/auth/login"
      primaryLabel="Retour à la connexion"
    />
  );
}
