# 🔧 App_Restaurant - Fiche Technique Détaillée

Documentation technique complète pour développeurs et administrateurs système.

---

## 📋 Informations Générales

| Propriété | Valeur |
|-----------|--------|
| **Nom du Projet** | App_Restaurant |
| **Version** | 1.0.0 |
| **Type** | Application Web Full-Stack |
| **Architecture** | Monolithique (Next.js) |
| **Langage Principal** | TypeScript |
| **Framework** | Next.js 15+ (App Router) |
| **Base de Données** | PostgreSQL 15+ |
| **Licence** | MIT |

---

## 🏗️ Stack Technique

### **Frontend**

#### **Core**
| Technologie | Version | Rôle |
|-------------|---------|------|
| Next.js | 14.2.x | Framework React SSR/SSG |
| React | 18.3.x | Librairie UI |
| TypeScript | 5.5.x | Typage statique |
| Tailwind CSS | 3.4.x | Framework CSS |

#### **UI Components**
| Librairie | Version | Usage |
|-----------|---------|-------|
| shadcn/ui | Latest | Composants UI |
| Radix UI | Latest | Primitives accessibles |
| Lucide React | Latest | Icônes |
| Framer Motion | 11.x | Animations |

#### **State Management**
| Librairie | Version | Usage |
|-----------|---------|-------|
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state (panier) |
| React Context | Built-in | Auth, notifications |

#### **Forms & Validation**
| Librairie | Version | Usage |
|-----------|---------|-------|
| React Hook Form | 7.x | Gestion formulaires |
| Zod | 3.x | Validation schémas |

#### **Utilities**
| Librairie | Version | Usage |
|-----------|---------|-------|
| date-fns | 3.x | Manipulation dates |
| clsx | 2.x | Classes conditionnelles |
| sonner | 1.x | Notifications toast |

### **Backend**

#### **Runtime & Framework**
| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | 18+ | Runtime JavaScript |
| Next.js API Routes | 14.x | API REST |
| Server Actions | 14.x | RPC-like API |

#### **Base de Données**
| Technologie | Version | Rôle |
|-------------|---------|------|
| PostgreSQL | 14+ | SGBD relationnel |
| Prisma ORM | 6.x | ORM type-safe |

#### **Authentification**
| Technologie | Version | Rôle |
|-------------|---------|------|
| Better Auth | Latest | Auth moderne |
| JWT | - | Tokens |
| bcrypt | 5.x | Hashing passwords |

#### **Temps Réel**
| Technologie | Version | Rôle |
|-------------|---------|------|
| Pusher | Latest | WebSocket |
| Server-Sent Events | Built-in | Streaming |

#### **Storage**
| Service | Usage |
|---------|-------|
| Cloudinary | Images |
| Vercel Blob | Fichiers |

---

## 🗄️ Schéma de Base de Données

### **Modèle Relationnel**

```prisma
// Utilisateurs et Authentification
model User {
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  emailVerified  Boolean   @default(false)
  image          String?
  role           UserRole  @default(user)
  phone          String?
  address        String?
  status         String    @default("active")
  notes          String?
  isDeleted      Boolean   @default(false)
  isAnonymous    Boolean?  @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relations
  sessions       Session[]
  accounts       Account[]
  orders         Order[]
  payments       Payment[]
  userPermissions UserPermission[]
}

// Commandes
model Order {
  id          String      @id @default(uuid())
  userId      String
  tableId     String?
  status      OrderStatus @default(pending)
  type        OrderType
  total       Decimal     @default(0)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  user        User        @relation(fields: [userId], references: [id])
  table       Table?      @relation(fields: [tableId], references: [id])
  orderItems  OrderItem[]
  payments    Payment[]
}

// Articles de commande
model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  menuItemId  String?
  name        String
  quantity    Int
  price       Decimal
  image       String?
  
  // Relations
  order       Order     @relation(fields: [orderId], references: [id])
  menuItem    MenuItem? @relation(fields: [menuItemId], references: [id])
}

// Menu
model MenuItem {
  id          String    @id @default(uuid())
  name        String
  description String?
  price       Decimal
  image       String?
  categoryId  String
  isAvailable Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  category    Category  @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
}

// Catégories
model Category {
  id          String     @id @default(uuid())
  name        String     @unique
  description String?
  order       Int        @default(0)
  
  // Relations
  menuItems   MenuItem[]
}

// Tables
model Table {
  id          String   @id @default(uuid())
  number      Int      @unique
  seats       Int
  location    String?
  status      String   @default("available")
  qrCode      String?  @unique
  
  // Relations
  orders      Order[]
}

// Paiements
model Payment {
  id          String   @id @default(uuid())
  orderId     String
  userId      String
  amount      Decimal
  method      String
  status      String   @default("pending")
  reference   String?
  createdAt   DateTime @default(now())
  
  // Relations
  order       Order    @relation(fields: [orderId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}

// Permissions par rôle
model RolePermission {
  id         String     @id @default(uuid())
  role       String
  permission String
  
  @@unique([role, permission])
}

// Permissions personnalisées
model UserPermission {
  id         String   @id @default(uuid())
  userId     String
  permission String
  granted    Boolean  @default(true)
  
  // Relations
  user       User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, permission])
}
```

### **Enums**

```typescript
enum UserRole {
  admin
  owner
  manager
  head_chef
  chef
  waiter
  cashier
  user
}

enum OrderStatus {
  pending
  preparing
  ready
  served
  cancelled
}

enum OrderType {
  dine_in
  takeaway
  delivery
}
```

### **Index et Optimisations**

```sql
-- Index pour performances
CREATE INDEX idx_orders_status ON "Order"(status);
CREATE INDEX idx_orders_created_at ON "Order"(createdAt DESC);
CREATE INDEX idx_orders_user_id ON "Order"(userId);
CREATE INDEX idx_menu_items_category ON "MenuItem"(categoryId);
CREATE INDEX idx_menu_items_available ON "MenuItem"(isAvailable);
```

---

## 🔐 Sécurité

### **Authentification**

#### **Flow d'Authentification**
```
1. User → Login Form
2. Server → Validate credentials
3. Server → Generate JWT
4. Server → Create session
5. Client → Store token (httpOnly cookie)
6. Client → Include token in requests
```

#### **Configuration Better Auth**
```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: prisma,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});
```

### **Permissions**

#### **Système de Permissions**
```typescript
// Vérification côté serveur
async function checkPermission(
  userId: string, 
  permission: Permission
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userPermissions: true }
  });
  
  // Permissions du rôle
  const rolePerms = ROLE_PERMISSIONS[user.role];
  if (rolePerms.includes(permission)) return true;
  
  // Permissions personnalisées
  const customPerm = user.userPermissions.find(
    p => p.permission === permission
  );
  
  return customPerm?.granted ?? false;
}
```

### **Protection CSRF**
```typescript
// Tokens CSRF pour formulaires
import { csrf } from '@/lib/csrf';

export async function POST(request: Request) {
  await csrf.verify(request);
  // Traitement...
}
```

### **Rate Limiting**
```typescript
// Limitation de requêtes
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  await limiter.check(request, 10); // 10 req/min
  // Traitement...
}
```

### **Validation des Données**
```typescript
// Validation avec Zod
import { z } from 'zod';

const OrderSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().min(1).max(100),
  })).min(1),
  type: z.enum(['dine_in', 'takeaway', 'delivery']),
  total: z.number().positive(),
});

// Utilisation
const validated = OrderSchema.parse(data);
```

---

## ⚡ Performance

### **Optimisations Frontend**

#### **Code Splitting**
```typescript
// Lazy loading des composants
const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  { loading: () => <Skeleton /> }
);
```

#### **Image Optimization**
```typescript
// Next.js Image
import Image from 'next/image';

<Image
  src="/plat.jpg"
  alt="Plat"
  width={800}
  height={600}
  priority={false}
  loading="lazy"
  placeholder="blur"
/>
```

#### **Caching**
```typescript
// React Query cache
const { data } = useQuery({
  queryKey: ['menu'],
  queryFn: fetchMenu,
  staleTime: 5 * 60 * 1000, // 5 min
  cacheTime: 10 * 60 * 1000, // 10 min
});
```

### **Optimisations Backend**

#### **Database Queries**
```typescript
// Prisma select optimisé
const orders = await prisma.order.findMany({
  select: {
    id: true,
    status: true,
    total: true,
    user: {
      select: {
        name: true,
        email: true,
      }
    }
  },
  where: { status: 'pending' },
  take: 10,
});
```

#### **Pagination**
```typescript
// Cursor-based pagination
async function getOrders(cursor?: string, limit = 20) {
  return await prisma.order.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
```

#### **Caching Redis** (Optionnel)
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedMenu() {
  const cached = await redis.get('menu');
  if (cached) return JSON.parse(cached);
  
  const menu = await prisma.menuItem.findMany();
  await redis.set('menu', JSON.stringify(menu), 'EX', 300);
  
  return menu;
}
```

---

## 🔄 Temps Réel

### **Configuration Pusher**

```typescript
// lib/pusher.ts (Server)
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Trigger event
await pusher.trigger('restaurant-channel', 'new-order', {
  order: orderData
});
```

```typescript
// lib/pusherClient.ts (Client)
import PusherClient from 'pusher-js';

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);

// Subscribe
const channel = pusherClient.subscribe('restaurant-channel');
channel.bind('new-order', (data) => {
  // Handle new order
});
```

### **Events Disponibles**

| Event | Channel | Payload | Description |
|-------|---------|---------|-------------|
| `new-order` | restaurant-channel | Order | Nouvelle commande |
| `order-updated` | restaurant-channel | Order | Commande modifiée |
| `order-status-updated` | restaurant-channel | { id, status } | Statut changé |
| `order-deleted` | restaurant-channel | { id } | Commande supprimée |

---

## 📊 Monitoring et Logs

### **Error Tracking (Sentry)**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### **Logging**

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  }
});

// Usage
logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Failed to create order');
```

---

## 🧪 Tests

### **Tests Unitaires (Jest)**

```typescript
// __tests__/utils/formatCurrency.test.ts
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats FCFA correctly', () => {
    expect(formatCurrency(1000)).toBe('1 000 FCFA');
  });
});
```

### **Tests d'Intégration**

```typescript
// __tests__/api/orders.test.ts
import { createOrder } from '@/actions/admin/order-actions';

describe('Order Actions', () => {
  it('creates an order successfully', async () => {
    const result = await createOrder({
      userId: 'test-user',
      items: [{ menuItemId: '1', quantity: 2 }],
      type: 'dine_in',
      total: 5000,
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
});
```

### **Tests E2E (Playwright)**

```typescript
// e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete order flow', async ({ page }) => {
  await page.goto('/menu');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="cart-button"]');
  await page.fill('[name="email"]', 'test@test.com');
  await page.click('[data-testid="submit-order"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 🚀 Déploiement

### **Build de Production**

```bash
# Build
pnpm build

# Analyse du bundle
pnpm analyze

# Start production
pnpm start
```

### **Variables d'Environnement Production**

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://resto-congo.cg
NEXT_PUBLIC_PUSHER_APP_KEY=...
PUSHER_SECRET=...
CLOUDINARY_CLOUD_NAME=...
SENTRY_DSN=...
```

### **Configuration Vercel**

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "BETTER_AUTH_SECRET": "@auth-secret"
  }
}
```

### **Health Checks**

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}
```

---

## 📈 Métriques

### **KPIs Techniques**

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Lighthouse Performance | > 90 | 95 |
| Lighthouse Accessibility | > 95 | 98 |
| Lighthouse SEO | > 90 | 92 |
| Time to First Byte (TTFB) | < 200ms | 150ms |
| First Contentful Paint (FCP) | < 1.8s | 1.2s |
| Largest Contentful Paint (LCP) | < 2.5s | 1.8s |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.05 |
| Time to Interactive (TTI) | < 3.8s | 2.5s |

### **Métriques Business**

- Temps moyen de commande : < 2 minutes
- Taux de conversion : > 15%
- Taux d'abandon panier : < 30%
- Temps de préparation moyen : 20 minutes

---

## 🔧 Maintenance

### **Tâches Régulières**

#### **Quotidiennes**
- Vérifier les logs d'erreurs
- Monitorer les performances
- Backup de la base de données

#### **Hebdomadaires**
- Analyser les métriques
- Vérifier les mises à jour de sécurité
- Nettoyer les données obsolètes

#### **Mensuelles**
- Mettre à jour les dépendances
- Optimiser la base de données
- Audit de sécurité

### **Commandes Utiles**

```bash
# Migrations
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate reset

# Database
npx prisma studio
npx prisma db push
npx prisma db seed

# Génération
npx prisma generate

# Analyse
pnpm analyze
pnpm audit
```

---

## 📞 Support Technique

### **Contacts**
- **Email** : tech@resto-congo.cg
- **Slack** : #tech-support
- **On-call** : +242 06 XXX XX XX

### **Documentation**
- **API Docs** : https://docs.resto-congo.cg/api
- **Wiki** : https://wiki.resto-congo.cg
- **Changelog** : https://github.com/resto-congo/CHANGELOG.md

---

**Version** : 1.0.0  
**Dernière mise à jour** : Octobre 2025  
**Mainteneur** : MBOKA TECH
