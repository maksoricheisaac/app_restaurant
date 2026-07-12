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
            fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
            backgroundColor: "#faf7f2",
            color: "#2a2320",
          }}
        >
          <div
            style={{
              height: "3rem",
              width: "3rem",
              borderRadius: "0.85rem",
              backgroundColor: "#ea6a24",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              boxShadow: "0 8px 20px -6px rgba(234,106,36,0.4)",
            }}
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
              L&apos;application a rencontré une erreur critique
            </p>
            <p style={{ fontSize: "0.9rem", color: "#7a6f66", marginTop: "0.5rem" }}>
              {error.message || "Veuillez recharger la page."}
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.75rem",
              backgroundColor: "#ea6a24",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 20px -6px rgba(234,106,36,0.4)",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
