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
  OWNER: 'owner',
  MANAGER: 'manager',
  WAITER: 'waiter',
  CHEF: 'chef',
  CASHIER: 'cashier',
} as const;

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const ALL_STAFF_ROLES = [
  StaffRole.OWNER,
  StaffRole.MANAGER,
  StaffRole.WAITER,
  StaffRole.CHEF,
  StaffRole.CASHIER,
] as const;

/**
 * Rôles assignables via la gestion d'équipe (création, modification,
 * invitation).
 *
 * « owner » en est délibérément exclu : le restaurant a exactement un
 * propriétaire, et ce statut ne change que par le flux atomique dédié
 * `StaffService.transferOwnership`. L'accepter ici laisserait n'importe quel
 * manager s'attribuer la propriété de l'établissement par un simple PATCH.
 */
export const ASSIGNABLE_STAFF_ROLES = [
  StaffRole.MANAGER,
  StaffRole.WAITER,
  StaffRole.CHEF,
  StaffRole.CASHIER,
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];
