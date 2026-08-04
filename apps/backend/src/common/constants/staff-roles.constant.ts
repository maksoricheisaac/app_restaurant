/**
 * Rôles de l'équipe, stockés dans `User.role`.
 *
 * Il n'existe qu'un établissement : une personne a donc au plus un rôle, porté
 * directement par son compte. La table de liaison qui portait autrefois cette
 * information a disparu avec le multi-tenant.
 *
 * Objet `const` plutôt qu'un `enum` TypeScript : les valeurs restent
 * structurellement compatibles avec le `String` que Postgres stocke (contrainte
 * CHECK sur `User.role`), ce qui évite les faux positifs
 * `@typescript-eslint/no-unsafe-enum-comparison` à chaque comparaison de rôle.
 */
export const StaffRole = {
  /**
   * Compte racine, créé par l'assistant de première installation et par lui
   * seul. Un index unique partiel en base garantit qu'il n'en existe **jamais
   * plus d'un** — voir la migration `super_admin`.
   *
   * Se distingue du propriétaire sur trois points :
   *  - il satisfait toute exigence `@Roles(...)` sans y être nommé ;
   *  - ses permissions ne sont pas configurables : il les a toutes, en
   *    permanence. Un compte racine qu'on peut priver de ses droits depuis
   *    l'interface est un verrouillage hors de la maison qui n'attend que son
   *    heure ;
   *  - il est intouchable par la gestion d'équipe : ni modification, ni
   *    suppression, ni désactivation, ni rétrogradation.
   */
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  WAITER: 'waiter',
  CHEF: 'chef',
  CASHIER: 'cashier',
} as const;

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const ALL_STAFF_ROLES = [
  StaffRole.SUPER_ADMIN,
  StaffRole.OWNER,
  StaffRole.MANAGER,
  StaffRole.WAITER,
  StaffRole.CHEF,
  StaffRole.CASHIER,
] as const;

/**
 * Le compte racine satisfait toute exigence de rôle sans y être nommé — voir
 * `RolesGuard`. Nommer ce test plutôt que d'écrire la comparaison littérale
 * dans chaque appelant rend la règle repérable, et son retrait détectable.
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === StaffRole.SUPER_ADMIN;
}

/**
 * Rôles assignables via la gestion d'équipe (création, modification,
 * invitation).
 *
 * Deux absents, pour deux raisons distinctes :
 *
 * « owner » : le restaurant a exactement un propriétaire, et ce statut ne
 * change que par le flux atomique dédié `StaffService.transferOwnership`.
 * L'accepter ici laisserait n'importe quel manager s'attribuer la propriété de
 * l'établissement par un simple PATCH.
 *
 * « super_admin » : ne s'obtient que par la première installation. Aucun flux
 * applicatif ne l'accorde, transfert de propriété compris.
 */
export const ASSIGNABLE_STAFF_ROLES = [
  StaffRole.MANAGER,
  StaffRole.WAITER,
  StaffRole.CHEF,
  StaffRole.CASHIER,
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];
