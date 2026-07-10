import { ConflictException, NotFoundException } from '@nestjs/common';
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

  const completeDto = {
    restaurantName: 'Le Maquis',
    slug: 'le-maquis',
    country: 'CG',
    currency: 'XAF',
    timezone: 'Africa/Brazzaville',
    cuisineType: 'Africaine',
    plan: 'pro',
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = buildService(prisma);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock_access_token');
    mockMailService.sendEmailVerification.mockResolvedValue(undefined);
  });

  // ─── initiateRegistration ──────────────────────────────────────────────────

  describe('initiateRegistration', () => {
    const dto = {
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@test.com',
      password: 'Password@1',
    };

    it('creates user with emailVerified: false', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no existing
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration(dto);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.emailVerified).toBe(false);
    });

    it('does NOT persist any restaurant/onboarding data at account creation', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration(dto);

      const createCall = prisma.user.create.mock.calls[0][0];
      // Aucune donnée d'onboarding intermédiaire ne doit être écrite ici.
      expect(createCall.data.onboardingCompleted).toBe(false);
      expect(createCall.data).not.toHaveProperty('accountType');
      expect(createCall.data).not.toHaveProperty('onboardingStep');
      expect(createCall.data).not.toHaveProperty('onboardingData');
    });

    it('creates user with emailVerificationToken', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration(dto);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.emailVerificationToken).toBeDefined();
      expect(typeof createCall.data.emailVerificationToken).toBe('string');
    });

    it('sends verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration(dto);

      expect(mockMailService.sendEmailVerification).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'alice@test.com' }),
      );
    });

    it('returns access_token and refresh_token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await service.initiateRegistration(dto);

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.email).toBe('alice@test.com');
    });

    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(service.initiateRegistration(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('concatenates firstName + lastName for name field', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration({
        ...dto,
        firstName: 'Jean',
        lastName: 'Martin',
      });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.name).toBe('Jean Martin');
    });

    it('does NOT include password in returned user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await service.initiateRegistration(dto);

      expect((result.user as any).password).toBeUndefined();
    });
  });

  // ─── completeOnboarding — provisionnement transactionnel ───────────────────

  describe('completeOnboarding', () => {
    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.completeOnboarding('ghost', completeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a slug already used by an active tenant (before any write)', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'other-tenant' });

      await expect(
        service.completeOnboarding('u1', completeDto),
      ).rejects.toThrow(ConflictException);
      // Rien ne doit être créé si le slug est pris.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates tenant + settings + owner membership + default categories in ONE transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.tenant.findFirst.mockResolvedValue(null);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const createdTenant = { id: 't1', slug: 'le-maquis', name: 'Le Maquis' };
      const tx = {
        tenant: { create: jest.fn().mockResolvedValue(createdTenant) },
        tenantMembership: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
        menuCategory: { createMany: jest.fn().mockResolvedValue({ count: 4 }) },
        user: {
          update: jest
            .fn()
            .mockResolvedValue({ ...baseUser, tenantId: 't1', onboardingCompleted: true }),
        },
      };
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      const result = await service.completeOnboarding('u1', completeDto);

      // Tenant créé avec settings imbriqués + plan/devise/slug corrects
      expect(tx.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Le Maquis',
            slug: 'le-maquis',
            plan: 'pro',
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

    it('is idempotent: returns current state without recreating when already completed', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        onboardingCompleted: true,
        tenantId: 't1',
      });
      prisma.tenant.findUnique.mockResolvedValue({ id: 't1', slug: 'le-maquis' });

      const result = await service.completeOnboarding('u1', completeDto);

      expect(result.alreadyCompleted).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
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

  // ─── Refresh token management ─────────────────────────────────────────────

  describe('refresh token management', () => {
    it('deletes oldest tokens when limit of 5 is reached', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
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

      await service.initiateRegistration({
        firstName: 'Alice',
        lastName: 'Dupont',
        email: 'alice@test.com',
        password: 'Password@1',
      });

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });
});
