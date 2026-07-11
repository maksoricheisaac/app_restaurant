import { ConflictException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Stable crypto mock — deterministic token for assertions
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest
    .fn()
    .mockReturnValue({ toString: () => 'mock_token_abc123' }),
  createHash: jest.requireActual('crypto').createHash,
}));

const mockMailService = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
};
const mockConfig = {
  get: jest.fn().mockReturnValue('http://localhost:4000'),
};
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_access_token'),
};

function buildService(prisma: MockPrisma) {
  return new OnboardingService(
    prisma as any,
    mockMailService as any,
    mockConfig as any,
    mockJwtService as any,
  );
}

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: MockPrisma;

  const baseUser = {
    id: 'u1',
    name: 'Alice Dupont',
    firstName: 'Alice',
    lastName: 'Dupont',
    email: 'alice@test.com',
    password: 'hashed_password',
    emailVerified: false,
    platformRole: 'user',
    tenantId: null,
    onboardingCompleted: false,
  };

  const registerDto = {
    firstName: 'Alice',
    lastName: 'Dupont',
    email: 'alice@test.com',
    password: 'Password@1',
    restaurantName: 'Le Maquis',
    slug: 'le-maquis',
    country: 'CG',
    currency: 'XAF',
    timezone: 'Africa/Brazzaville',
    cuisineType: 'Africaine',
  };

  /**
   * Helper — câble un $transaction mock qui capture tous les appels effectués
   * dans le callback (user.create → tenant.create → membership → catégories →
   * user.update) et renvoie le tenant/user attendus.
   */
  function wireTransaction() {
    const createdTenant = { id: 't1', slug: 'le-maquis', name: 'Le Maquis' };
    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({ ...baseUser }),
        update: jest.fn().mockResolvedValue({
          ...baseUser,
          tenantId: 't1',
          onboardingCompleted: true,
        }),
      },
      tenant: { create: jest.fn().mockResolvedValue(createdTenant) },
      tenantMembership: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
      menuCategory: { createMany: jest.fn().mockResolvedValue({ count: 4 }) },
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(tx));
    return { tx, createdTenant };
  }

  beforeEach(() => {
    prisma = createMockPrisma();
    service = buildService(prisma);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock_access_token');
    mockMailService.sendEmailVerification.mockResolvedValue(undefined);
  });

  // ─── register — provisionnement transactionnel unique ──────────────────────

  describe('register', () => {
    it('throws ConflictException when email already exists (no write attempted)', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when slug already taken (no write attempted)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'other-tenant' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates user + tenant + settings + owner membership + default categories in ONE transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue(null);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });
      const { tx, createdTenant } = wireTransaction();

      const result = await service.register(registerDto);

      // Compte créé DANS la transaction (pas avant), non vérifié, sans tenant.
      const userCreate = tx.user.create.mock.calls[0][0];
      expect(userCreate.data.email).toBe('alice@test.com');
      expect(userCreate.data.name).toBe('Alice Dupont');
      expect(userCreate.data.emailVerified).toBe(false);
      expect(userCreate.data.emailVerificationToken).toBeDefined();
      expect(userCreate.data.onboardingCompleted).toBe(false);

      // Tenant TOUJOURS créé sur le plan free (upgrade payant via /billing).
      expect(tx.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Le Maquis',
            slug: 'le-maquis',
            plan: 'free',
            currency: 'XAF',
            onboardingCompleted: true,
            settings: { create: { name: 'Le Maquis' } },
          }),
        }),
      );
      // Membership owner
      expect(tx.tenantMembership.create).toHaveBeenCalledWith({
        data: { tenantId: 't1', userId: 'u1', role: 'owner' },
      });
      // 4 catégories par défaut
      const catArg = tx.menuCategory.createMany.mock.calls[0][0];
      expect(catArg.data).toHaveLength(4);
      // User lié au tenant + onboarding terminé
      expect(tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 't1',
            onboardingCompleted: true,
          }),
        }),
      );
      // Réponse cohérente (owner + tenant + tokens frais)
      expect(result.success).toBe(true);
      expect(result.tenant).toEqual(createdTenant);
      expect(result.user.role).toBe('owner');
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it('sends a verification email after successful registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue(null);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });
      wireTransaction();

      await service.register(registerDto);

      expect(mockMailService.sendEmailVerification).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'alice@test.com' }),
      );
    });

    it('still succeeds when the verification email fails (mail is best-effort)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue(null);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });
      wireTransaction();
      mockMailService.sendEmailVerification.mockRejectedValueOnce(
        new Error('SMTP down'),
      );

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
    });

    it('does NOT include password in the returned user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue(null);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });
      wireTransaction();

      const result = await service.register(registerDto);

      expect((result.user as any).password).toBeUndefined();
    });
  });

  // ─── checkSlugAvailability ────────────────────────────────────────────────

  describe('checkSlugAvailability', () => {
    it('returns { available: true } when slug is not taken', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);
      const result = await service.checkSlugAvailability('my-restaurant');
      expect(result).toEqual({ available: true });
    });

    it('returns { available: false } when slug is already taken', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'existing-tenant' });
      const result = await service.checkSlugAvailability('taken-slug');
      expect(result).toEqual({ available: false });
    });

    it('excludes soft-deleted tenants — a freed slug is reported available', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);
      await service.checkSlugAvailability('reusable-slug');

      const call = prisma.tenant.findFirst.mock.calls[0][0];
      expect(call.where).toEqual({ slug: 'reusable-slug', deletedAt: null });
    });
  });

  // ─── checkEmailAvailability ───────────────────────────────────────────────

  describe('checkEmailAvailability', () => {
    it('returns { available: true } when email is free', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.checkEmailAvailability('new@test.com');
      expect(result).toEqual({ available: true });
    });

    it('returns { available: false } when email is already used', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const result = await service.checkEmailAvailability('alice@test.com');
      expect(result).toEqual({ available: false });
    });
  });

  // ─── Refresh token management ─────────────────────────────────────────────

  describe('refresh token management', () => {
    it('deletes oldest tokens when limit of 5 is reached', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue(null);
      // Simulate 5 existing tokens (limit is 5 → should delete oldest)
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt-old-1' },
        { id: 'rt-old-2' },
        { id: 'rt-old-3' },
        { id: 'rt-old-4' },
        { id: 'rt-old-5' },
      ]);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });
      wireTransaction();

      await service.register(registerDto);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });
});
