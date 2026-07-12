"use client";

import { useEffect } from "react";

import { monitoring } from "@/lib/monitoring";
import { ErrorState } from "@/components/customs/public/error-state";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureError(error, { context: "public-marketing" });
  }, [error]);

  return (
    <ErrorState
      icon="alert"
      title="Une erreur est survenue"
      message={error.message || "Impossible de charger cette page. Réessayez dans un instant."}
      onRetry={reset}
      full={false}
    />
  );
}
