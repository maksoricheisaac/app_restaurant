import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});


const eslintConfig = [
  {
    ignores: ["node_modules/", ".next/", "src/generated"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Cohérent avec apps/backend/eslint.config.mjs : la couche
      // services/hooks (src/services/*.ts, src/hooks/api/*.ts) qui parle au
      // backend faiblement typé utilise `any` de façon extensive et
      // délibérée (~190 occurrences). Retyper tous ces points d'appel est
      // hors scope d'une passe de nettoyage lint et trop risqué à faire à
      // l'aveugle. Désactivé pour rester cohérent avec le backend plutôt que
      // de forcer une erreur bloquante sur une dette pré-existante.
      "@typescript-eslint/no-explicit-any": "off",
      // Convention du projet (partagée avec apps/backend/eslint.config.mjs) :
      // préfixer par `_` un paramètre/variable délibérément inutilisé (ex.
      // callback d'event dont seul le fait d'être appelé compte, résultat de
      // destructuring dont on ne garde qu'une partie) plutôt que le
      // supprimer et casser la lisibilité de la signature attendue.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
