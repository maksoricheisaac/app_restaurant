-- -----------------------------------------------------------------------------
-- COMPTE RACINE : super_admin
--
-- Un sixième rôle, au-dessus du propriétaire, créé par l'assistant de première
-- installation et par lui seul. C'est lui qui répond à la question « le
-- logiciel a-t-il déjà été installé ? » : tant qu'aucun super_admin n'existe,
-- l'API s'ouvre sur l'assistant.
--
-- Deux garanties sont posées ici plutôt que dans le code applicatif, parce
-- qu'un test applicatif perd toujours face à deux requêtes simultanées :
--   1. le rôle appartient au domaine autorisé de `User.role` ;
--   2. il n'existe JAMAIS plus d'un super_admin, quel que soit le nombre
--      d'instances de l'API qui écrivent en même temps.
-- -----------------------------------------------------------------------------

-- 1. Domaine de `User.role` -----------------------------------------------------
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";

ALTER TABLE "User"
  ADD CONSTRAINT "User_role_check"
  CHECK ("role" IN ('super_admin', 'owner', 'manager', 'waiter', 'chef', 'cashier'));

-- `StaffInvite_role_check` reste volontairement inchangé : ni « owner » ni
-- « super_admin » ne s'obtiennent par invitation.

-- 2. Unicité du compte racine ---------------------------------------------------
--
-- Index unique PARTIEL : la contrainte ne porte que sur les lignes dont le rôle
-- vaut 'super_admin'. Comme elles partagent toutes la même valeur de "role",
-- l'unicité sur cette colonne interdit qu'il y en ait deux — tandis que les
-- autres rôles restent librement répétables.
--
-- Non exprimable en Prisma (aucun support des index partiels dans le schéma),
-- d'où la déclaration SQL directe et le commentaire correspondant dans
-- schema.prisma. Un `prisma migrate diff` ne le verra pas : ne pas le
-- supprimer en croyant à une dérive de schéma.
DROP INDEX IF EXISTS "User_single_super_admin_key";

CREATE UNIQUE INDEX "User_single_super_admin_key"
  ON "User" ("role")
  WHERE "role" = 'super_admin';
