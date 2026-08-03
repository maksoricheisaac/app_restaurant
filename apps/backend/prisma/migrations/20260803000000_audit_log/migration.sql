-- Piste d'audit persistante.
--
-- Remplace une journalisation qui n'existait que dans les logs applicatifs —
-- non interrogeable, rotative, et qui manquait de toute façon les
-- encaissements (le middleware surveillait /cash-register/payment quand la
-- route réelle est /cash-register/pay).

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "durationMs" INTEGER,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
-- SET NULL et non CASCADE : supprimer un compte ne doit pas effacer la trace
-- de ce qu'il a fait. L'e-mail et le rôle sont recopiés sur la ligne d'audit
-- au moment du fait, précisément pour rester lisibles après coup.
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable
-- « Report » n'a jamais été lu ni écrit par aucun service : la table était
-- déclarée dans le schéma mais sans aucun code pour l'alimenter. Les rapports
-- sont calculés à la volée par ReportsService.
DROP TABLE IF EXISTS "Report";
