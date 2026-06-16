-- Migration: 20260615130000_add_payment_reservation_indexes
-- Ajoute des index composites manquants pour les requêtes filtrées par
-- période (tenantId + date), utilisées par la clôture de caisse et le
-- tableau de bord / liste des réservations.

CREATE INDEX "Payment_tenantId_createdAt_idx" ON "Payment"("tenantId", "createdAt");
CREATE INDEX "Reservation_tenantId_date_idx" ON "Reservation"("tenantId", "date");
