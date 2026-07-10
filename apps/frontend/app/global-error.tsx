"use client";

import { useEffect } from "react";
import { monitoring } from "@/lib/monitoring";

// global-error.tsx remplace TOUT le root layout en cas d'erreur dans celui-
// ci (pas seulement dans une page) — il doit donc fournir son propre
// <html>/<body> et éviter toute dépendance qui pourrait elle-même avoir
// causé l'erreur (styles inline plutôt que classes Tailwind).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureError(error, { context: "app-global" });
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            gap: "1.25rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: "#f8fafc",
            color: "#1e293b",
          }}
        >
          <div>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
              L&apos;application a rencontré une erreur critique
            </p>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.5rem" }}>
              {error.message || "Veuillez recharger la page."}
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              padding: "0.65rem 1.5rem",
              backgroundColor: "#0f172a",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
