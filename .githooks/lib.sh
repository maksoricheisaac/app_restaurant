#!/usr/bin/env sh
# Fonctions partagées par les hooks pre-commit / pre-push.
# Repo Flash Menu : deux apps indépendantes (apps/backend, apps/frontend),
# pnpm 10, pas de package.json racine.

ROOT="$(git rev-parse --show-toplevel)"

# pnpm dans le PATH ? Sinon on n'échoue PAS : un commit depuis un IDE sans PATH
# complet ne doit pas être bloqué par l'absence d'outil. On avertit et on laisse
# passer — la CI reste le filet de sécurité final.
PNPM_MISSING=0
if ! command -v pnpm >/dev/null 2>&1; then
  echo "⚠  pnpm introuvable dans le PATH — checks locaux ignorés (la CI vérifiera)."
  PNPM_MISSING=1
fi

fail() {
  echo ""
  echo "✖ Échec : $1"
  echo "  → Action git ANNULÉE. Corrige l'erreur ci-dessus puis recommence."
  echo "    (Contournement d'urgence, à éviter : git commit/push --no-verify)"
  exit 1
}

# Lit une liste de chemins sur stdin, imprime "backend" et/ou "frontend".
detect_apps() {
  awk -F/ '
    $1=="apps" && $2=="backend"  { b=1 }
    $1=="apps" && $2=="frontend" { f=1 }
    END { if (b) print "backend"; if (f) print "frontend" }
  '
}

# run_app_checks <app> <do_build: 0|1>
run_app_checks() {
  app="$1"
  do_build="$2"
  dir="$ROOT/apps/$app"
  [ -d "$dir" ] || return 0
  [ "$PNPM_MISSING" = "1" ] && return 0

  echo "▶ [$app] lint…"
  ( cd "$dir" && pnpm lint:ci ) || fail "$app — lint"

  echo "▶ [$app] typecheck (tsc --noEmit)…"
  ( cd "$dir" && pnpm exec tsc --noEmit ) || fail "$app — typecheck"

  if [ "$do_build" = "1" ]; then
    echo "▶ [$app] build…"
    ( cd "$dir" && pnpm build ) || fail "$app — build"
  fi
}
