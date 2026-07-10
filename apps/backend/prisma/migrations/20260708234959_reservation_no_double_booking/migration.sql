-- Migration: reservation_no_double_booking
-- La détection de conflit de réservation (ReservationsService.create) ne
-- reposait que sur une vérification applicative dans une transaction —
-- sous READ COMMITTED (isolation par défaut de Postgres), deux requêtes
-- concurrentes peuvent toutes deux passer ce contrôle avant que l'une ou
-- l'autre ne commit, doublant la réservation d'une même table au même
-- créneau. On ajoute un index unique PARTIEL qui fait de la base de
-- données le véritable garde-fou, pas seulement le code applicatif.
--
-- Exclusions : réservations annulées (une table libérée peut être
-- reréservée), soft-deleted, et sans table assignée (tableId NULL — les
-- valeurs NULL ne participent de toute façon jamais à un conflit d'index
-- unique Postgres, le filtre est explicite ici pour la lisibilité).

CREATE UNIQUE INDEX "Reservation_no_double_booking_key"
  ON "Reservation"("tenantId", "tableId", "date", "time")
  WHERE "status" != 'cancelled'::"ReservationStatus"
    AND "deletedAt" IS NULL
    AND "tableId" IS NOT NULL;
