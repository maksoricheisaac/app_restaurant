-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('open', 'closed');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cashSessionId" TEXT;

-- CreateTable
CREATE TABLE "CashRegisterSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'open',
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingAmount" DECIMAL(65,30) NOT NULL,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "closingAmount" DECIMAL(65,30),
    "expectedAmount" DECIMAL(65,30),
    "variance" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "CashRegisterSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashRegisterSession_tenantId_idx" ON "CashRegisterSession"("tenantId");

-- CreateIndex
CREATE INDEX "CashRegisterSession_tenantId_status_idx" ON "CashRegisterSession"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Payment_cashSessionId_idx" ON "Payment"("cashSessionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashRegisterSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Un seul index unique PARTIEL : au plus une session 'open' par tenant à
-- la fois. C'est la base de données qui empêche deux caissiers d'ouvrir
-- chacun une session simultanément (pas seulement un contrôle applicatif),
-- exactement le genre de garde-fou qui manquait pour les réservations
-- avant sa propre contrainte partielle.
CREATE UNIQUE INDEX "CashRegisterSession_one_open_per_tenant_key"
  ON "CashRegisterSession"("tenantId")
  WHERE "status" = 'open';
