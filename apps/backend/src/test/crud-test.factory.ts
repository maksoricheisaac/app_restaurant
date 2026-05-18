/**
 * Generic CRUD test factory for Flash Menu services.
 *
 * All business services follow the same pattern:
 *   findAll(tenantId, filters?) → array
 *   findOne(tenantId, id) → item | null
 *   create(tenantId, dto, userId?) → item
 *   update(tenantId, id, dto) → item
 *   remove(tenantId, id) → item | void
 *
 * Usage:
 *   import { buildCrudSuite } from '../test/crud-test.factory';
 *   buildCrudSuite('CategoriesService', () => ({ service, prisma }), {
 *     findAll: { prismaCalls: ['menuCategory.findMany'] },
 *     ...
 *   });
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockPrisma } from '../__tests__/prisma.mock';

export interface CrudContext<S = any> {
  service: S;
  prisma: MockPrisma;
}

export interface CrudSuiteOptions {
  tenantId?: string;
  itemId?: string;
  createDto?: Record<string, unknown>;
  updateDto?: Record<string, unknown>;
  mockItem?: Record<string, unknown>;
  paginatedResult?: { data: unknown[]; pagination: unknown };
  listResult?: unknown[];
}

// ─── Standard assertion helpers ───────────────────────────────────────────────

export function assertTenantIsolation(
  fn: (tenantId: string | undefined) => Promise<unknown>,
) {
  it('throws ForbiddenException when tenantId is undefined', async () => {
    await expect(fn(undefined)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when tenantId is empty string', async () => {
    await expect(fn('')).rejects.toThrow(ForbiddenException);
  });
}

export function assertNotFoundHandling(
  fn: () => Promise<unknown>,
  label = 'when item does not exist',
) {
  it(`throws NotFoundException ${label}`, async () => {
    await expect(fn()).rejects.toThrow(NotFoundException);
  });
}

export function assertPrismaCalledWithTenantId(
  mockFn: jest.MockedFunction<any>,
  tenantId: string,
) {
  const call = mockFn.mock.calls[0]?.[0];
  expect(call?.where?.tenantId).toBe(tenantId);
}

// ─── Service mock builder ─────────────────────────────────────────────────────

export function mockCrudPrismaModel(model: any, opts: {
  findResult?: unknown;
  findManyResult?: unknown[];
  createResult?: unknown;
  updateResult?: unknown;
  deleteResult?: unknown;
  countResult?: number;
}) {
  if (opts.findResult !== undefined) {
    model.findFirst?.mockResolvedValue(opts.findResult);
    model.findUnique?.mockResolvedValue(opts.findResult);
  }
  if (opts.findManyResult !== undefined) model.findMany?.mockResolvedValue(opts.findManyResult);
  if (opts.createResult !== undefined) model.create?.mockResolvedValue(opts.createResult);
  if (opts.updateResult !== undefined) model.update?.mockResolvedValue(opts.updateResult);
  if (opts.deleteResult !== undefined) model.delete?.mockResolvedValue(opts.deleteResult);
  if (opts.countResult !== undefined) model.count?.mockResolvedValue(opts.countResult);
}

// ─── Standard CRUD suite builder ──────────────────────────────────────────────

export function describeWithTenant(
  title: string,
  tenantId: string,
  fn: (tenantId: string) => void,
) {
  describe(`${title} [tenantId=${tenantId}]`, () => fn(tenantId));
}

/**
 * Standard tenant isolation suite.
 * Tests that a method throws ForbiddenException when tenantId is missing.
 */
export function describeTenantIsolation(
  methodName: string,
  fn: (tenantId: undefined | '') => Promise<unknown>,
) {
  describe(`${methodName} — tenant isolation`, () => {
    it('rejects undefined tenantId', async () => {
      await expect(fn(undefined)).rejects.toThrow(ForbiddenException);
    });
  });
}
