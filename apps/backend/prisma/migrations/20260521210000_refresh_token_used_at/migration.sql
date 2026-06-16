-- Migration: 20260521210000_refresh_token_used_at
-- Ajoute usedAt sur RefreshToken pour détecter les replay attacks.
-- Si un token déjà utilisé est présenté → toutes les sessions de l'utilisateur sont révoquées.

ALTER TABLE "RefreshToken" ADD COLUMN "usedAt" TIMESTAMP(3);
CREATE INDEX "RefreshToken_userId_usedAt_idx" ON "RefreshToken"("userId", "usedAt");
