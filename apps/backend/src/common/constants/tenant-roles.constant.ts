/**
 * Tenant-scoped roles stored in `TenantMembership.role`.
 * Mirrors the comment on `TenantMembership.role` in prisma/schema.prisma.
 */
export enum TenantRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  WAITER = 'waiter',
  HEAD_CHEF = 'head_chef',
  CHEF = 'chef',
  CASHIER = 'cashier',
}

/**
 * Roles that can be assigned to a staff member through the generic
 * role-management endpoints (staff creation/update, membership invites and
 * role updates).
 *
 * "owner" is deliberately excluded: a tenant always has exactly one owner,
 * and ownership can only change through the dedicated, atomic
 * `MembershipsService.transferOwnership` flow. Accepting "owner" here would
 * let any manager grant full tenant ownership to themselves or anyone else
 * via a simple PATCH.
 */
export const ASSIGNABLE_TENANT_ROLES = [
  TenantRole.MANAGER,
  TenantRole.WAITER,
  TenantRole.HEAD_CHEF,
  TenantRole.CHEF,
  TenantRole.CASHIER,
] as const;

export type AssignableTenantRole = (typeof ASSIGNABLE_TENANT_ROLES)[number];
