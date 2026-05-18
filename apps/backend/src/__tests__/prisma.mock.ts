/**
 * Prisma mock factory for unit tests.
 * Creates a deep jest mock of PrismaService with ALL models mocked.
 *
 * Adding a new model: add it to PRISMA_MODELS array only.
 */

const PRISMA_MODELS = [
  'user', 'tenant', 'tenantMembership', 'menuItem', 'menuCategory',
  'table', 'order', 'orderItemsOnOrders', 'refreshToken', 'featureFlag',
  'customer', 'reservation', 'ingredient', 'recipe', 'stockMovement',
  'payment', 'transaction', 'deliveryZone', 'openingHours', 'exceptionalClosure',
  'restaurantSettings', 'message', 'report', 'rolePermission', 'userPermission',
  'domain',
] as const;

type PrismaModelMock = {
  findUnique: jest.MockedFunction<any>;
  findFirst: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  updateMany: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  deleteMany: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
  aggregate: jest.MockedFunction<any>;
  groupBy: jest.MockedFunction<any>;
};

export type MockPrisma = {
  [K in (typeof PRISMA_MODELS)[number]]: PrismaModelMock;
} & {
  $queryRaw: jest.MockedFunction<any>;
  $transaction: jest.MockedFunction<any>;
  $connect: jest.MockedFunction<any>;
  $disconnect: jest.MockedFunction<any>;
};

function mockModel(): PrismaModelMock {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _sum: { total: null }, _count: { _all: 0 } }),
    groupBy: jest.fn().mockResolvedValue([]),
  };
}

export function createMockPrisma(): MockPrisma {
  const models = Object.fromEntries(PRISMA_MODELS.map((name) => [name, mockModel()]));
  return {
    ...models,
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $transaction: jest.fn().mockImplementation((fn: any) => {
      if (typeof fn === 'function') return fn(createMockPrisma());
      // Array form: [op1, op2] — return them as-is
      return Promise.resolve(fn);
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as unknown as MockPrisma;
}
