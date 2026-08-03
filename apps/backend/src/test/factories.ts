/**
 * Fabriques de données de test.
 *
 * Usage :
 *   const user = UserFactory.create();
 *   const restaurant = RestaurantFactory.create({ currency: 'XAF' });
 *   const order = OrderFactory.create({ status: 'preparing' });
 *
 * Chaque fabrique renvoie un objet simple conforme au modèle Prisma.
 * N'importe quel champ se surcharge en passant un objet partiel.
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
  role: string;
  status: string;
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
      role: 'waiter',
      status: 'active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },

  unverified(overrides: Partial<UserLike> = {}): UserLike {
    return UserFactory.create({ emailVerified: false, ...overrides });
  },

  owner(overrides: Partial<UserLike> = {}): UserLike {
    return UserFactory.create({ role: 'owner', ...overrides });
  },

  inactive(overrides: Partial<UserLike> = {}): UserLike {
    return UserFactory.create({ status: 'inactive', ...overrides });
  },
};

// ─── Restaurant ───────────────────────────────────────────────────────────

export interface RestaurantLike {
  id: string;
  name: string;
  slogan: string | null;
  logo: string | null;
  primaryColor: string;
  country: string | null;
  currency: string;
  timezone: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  setupCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const RestaurantFactory = {
  create(overrides: Partial<RestaurantLike> = {}): RestaurantLike {
    return {
      // Singleton : l'identifiant est constant, comme en base.
      id: 'restaurant',
      name: 'Restaurant de test',
      slogan: null,
      logo: null,
      primaryColor: '#f97316',
      country: 'CG',
      currency: 'XAF',
      timezone: 'Africa/Brazzaville',
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: false,
      setupCompleted: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },

  notSetUp(overrides: Partial<RestaurantLike> = {}): RestaurantLike {
    return RestaurantFactory.create({ setupCompleted: false, ...overrides });
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
      categoryId: `cat-${n}`,
      deletedAt: null,
      ...overrides,
    };
  },
};

// ─── Order ────────────────────────────────────────────────────────────────

export interface OrderLike {
  id: string;
  userId: string | null;
  type: string;
  status: string;
  total: number;
  specialNotes: string | null;
  tableId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderFactory = {
  create(overrides: Partial<OrderLike> = {}): OrderLike {
    const n = seq();
    return {
      id: `order-${n}`,
      userId: null,
      type: 'dine_in',
      status: 'pending',
      total: 3000,
      specialNotes: null,
      tableId: null,
      deletedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  },
};

// ─── Charge utile JWT (tests AuthMiddleware / Gateway) ────────────────────

/**
 * Le jeton ne porte que l'identité : le rôle est relu en base par AuthGuard.
 */
export const JwtPayloadFactory = {
  create(overrides: Record<string, unknown> = {}) {
    const n = seq();
    return {
      sub: `user-${n}`,
      email: `test${n}@flashmenu.test`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      ...overrides,
    };
  },
};
