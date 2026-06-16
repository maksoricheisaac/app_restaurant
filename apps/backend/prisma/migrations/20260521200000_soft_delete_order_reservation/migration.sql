-- Migration: 20260521200000_soft_delete_order_reservation
-- Ajoute soft-delete (deletedAt) sur Order et Reservation
-- Protège l'historique comptable des commandes et l'historique des réservations

-- Order soft-delete
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Order_tenantId_deletedAt_idx" ON "Order"("tenantId", "deletedAt");

-- Reservation soft-delete
ALTER TABLE "Reservation" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Reservation_tenantId_deletedAt_idx" ON "Reservation"("tenantId", "deletedAt");
