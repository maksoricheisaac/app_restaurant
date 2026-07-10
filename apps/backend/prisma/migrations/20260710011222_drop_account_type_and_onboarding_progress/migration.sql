-- Onboarding refactor: le wizard n'écrit plus en base étape par étape.
-- Les données intermédiaires (accountType, progression, brouillon) ne sont
-- plus persistées côté serveur — tout est finalisé en une transaction unique.
-- Suppression des colonnes devenues inutiles sur "User".
ALTER TABLE "User" DROP COLUMN IF EXISTS "accountType";
ALTER TABLE "User" DROP COLUMN IF EXISTS "onboardingData";
ALTER TABLE "User" DROP COLUMN IF EXISTS "onboardingStep";
