/**
 * Test data factories for Flash Menu.
 *
 * Usage:
 *   const user = UserFactory.create();
 *   const tenant = TenantFactory.create({ plan: 'pro' });
 *   const order = OrderFactory.create({ tenantId: tenant.id });
 *
 * All factories return plain objects matching the Prisma model shape.
 * Override any field by passing a partial object.
 */

let _counter = 0;
const seq = () => ++_counter;

// ─── User ─────────────────────────────────────────────────────────────────

export interface UserLike {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  password: string;
  emailVerified: boolean;
  platformRole: string;
  status: string;
  tenantId: string | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  accountType: string | null;
  onboardingData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserFactory = {
  create(overrides: Partial<UserLike> = {}): UserLike {
    const n = seq();
    return {
      id: `user-${n}`,
      email: `user${n}@flashmenu.test`,
      name: `User ${n}`,
      firstName: `First${n}`,
      lastName: `Last${n}`,
      password: '$2b$10$hashedpassword',
      emailVerified: true,
      platformRole: 'user',
      status: 'active',
      tenantId: null,
      onboardingStep: 5,
      onboardingCompleted: true,
      accountType: 'OWNER',
      onboardingData: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },

  unverified(overrides: Partial<UserLike> = {}): UserLike {
    return UserFactory.create({ emailVerified: false, onboardingStep: 1, onboardingCompleted: false, ...overrides });
  },

  superAdmin(overrides: Partial<UserLike> = {}): UserLike {
    return UserFactory.create({ platformRole: 'super_admin', ...overrides });
  },
};

// ─── Tenant ───────────────────────────────────────────────────────────────

export interface TenantLike {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  logo: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  gracePeriodEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const TenantFactory = {
  create(overrides: Partial<TenantLike> = {}): TenantLike {
    const n = seq();
    return {
      id: `tenant-${n}`,
      name: `Restaurant ${n}`,
      slug: `restaurant-${n}`,
      plan: 'free',
      status: 'active',
      logo: null,
      country: 'CG',
      currency: 'XAF',
      timezone: 'Africa/Brazzaville',
      onboardingCompleted: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      gracePeriodEndsAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },

  pro(overrides: Partial<TenantLike> = {}): TenantLike {
    return TenantFactory.create({
      plan: 'pro',
      stripeSubscriptionId: `sub_${seq()}`,
      subscriptionStatus: 'active',
      ...overrides,
    });
  },

  suspended(overrides: Partial<TenantLike> = {}): TenantLike {
    return TenantFactory.create({
      status: 'suspended',
      subscriptionStatus: 'past_due',
      gracePeriodEndsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      ...overrides,
    });
  },
};

// ─── Membership ───────────────────────────────────────────────────────────

export interface MembershipLike {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const MembershipFactory = {
  create(overrides: Partial<MembershipLike> = {}): MembershipLike {
    const n = seq();
    return {
      id: `membership-${n}`,
      tenantId: overrides.tenantId ?? `tenant-${n}`,
      userId: overrides.userId ?? `user-${n}`,
      role: 'owner',
      permissions: [],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },
};

// ─── MenuItem ─────────────────────────────────────────────────────────────

export interface MenuItemLike {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  tenantId: string;
  categoryId: string;
  deletedAt: Date | null;
}

export const MenuItemFactory = {
  create(overrides: Partial<MenuItemLike> = {}): MenuItemLike {
    const n = seq();
    return {
      id: `item-${n}`,
      name: `Plat ${n}`,
      description: null,
      price: 1500 + n * 100,
      image: null,
      available: true,
      tenantId: overrides.tenantId ?? `tenant-${n}`,
      categoryId: `cat-${n}`,
      deletedAt: null,
      ...overrides,
    };
  },
};

// ─── Order ────────────────────────────────────────────────────────────────

export interface OrderLike {
  id: string;
  tenantId: string;
  userId: string | null;
  type: string;
  status: string;
  total: number;
  specialNotes: string | null;
  tableId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderFactory = {
  create(overrides: Partial<OrderLike> = {}): OrderLike {
    const n = seq();
    return {
      id: `order-${n}`,
      tenantId: overrides.tenantId ?? `tenant-${n}`,
      userId: null,
      type: 'dine_in',
      status: 'pending',
      total: 3000,
      specialNotes: null,
      tableId: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },
};

// ─── JWT payload (for AuthMiddleware / Gateway tests) ─────────────────────

export const JwtPayloadFactory = {
  create(overrides: Record<string, unknown> = {}) {
    return {
      sub: `user-${seq()}`,
      email: `test${seq()}@flashmenu.test`,
      role: 'owner',
      platformRole: 'user',
      tenantId: `tenant-${seq()}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      ...overrides,
    };
  },
};
