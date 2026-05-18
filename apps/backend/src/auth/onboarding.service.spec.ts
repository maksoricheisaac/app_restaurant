import { ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Stable crypto mock — deterministic token for assertions
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock_token_abc123' }),
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
    onboardingStep: 1,
    onboardingCompleted: false,
    accountType: null,
    onboardingData: null,
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
    const dto = { firstName: 'Alice', lastName: 'Dupont', email: 'alice@test.com', password: 'Password@1' };

    it('creates user with emailVerified: false', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no existing
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration(dto);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.emailVerified).toBe(false);
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

      await expect(service.initiateRegistration(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('concatenates firstName + lastName for name field', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      await service.initiateRegistration({ ...dto, firstName: 'Jean', lastName: 'Martin' });

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

  // ─── saveAccountType ───────────────────────────────────────────────────────

  describe('saveAccountType', () => {
    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.saveAccountType('u1', { accountType: 'OWNER' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when onboarding already completed', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, onboardingCompleted: true });
      await expect(service.saveAccountType('u1', { accountType: 'OWNER' })).rejects.toThrow(BadRequestException);
    });

    it('advances onboardingStep to at least 2', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, onboardingStep: 1 });
      prisma.user.update.mockResolvedValue({ ...baseUser, onboardingStep: 2 });

      const result = await service.saveAccountType('u1', { accountType: 'OWNER' });

      expect(result.onboardingStep).toBe(2);
      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data.accountType).toBe('OWNER');
    });

    it('does not decrease onboardingStep if already higher', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, onboardingStep: 3 });
      prisma.user.update.mockResolvedValue({ ...baseUser, onboardingStep: 3 });

      await service.saveAccountType('u1', { accountType: 'OWNER' });

      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data.onboardingStep).toBe(3); // max(3, 2) = 3
    });
  });

  // ─── checkSlugAvailability ────────────────────────────────────────────────

  describe('checkSlugAvailability', () => {
    it('returns { available: true } when slug is not taken', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      const result = await service.checkSlugAvailability('my-restaurant');
      expect(result).toEqual({ available: true });
    });

    it('returns { available: false } when slug is already taken', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant' });
      const result = await service.checkSlugAvailability('taken-slug');
      expect(result).toEqual({ available: false });
    });
  });

  // ─── getOnboardingState ───────────────────────────────────────────────────

  describe('getOnboardingState', () => {
    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getOnboardingState('ghost-id')).rejects.toThrow(NotFoundException);
    });

    it('returns onboarding data for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        onboardingStep: 2,
        onboardingCompleted: false,
        onboardingData: { accountType: 'OWNER' },
        accountType: 'OWNER',
        firstName: 'Alice',
        lastName: 'Dupont',
        email: 'alice@test.com',
      });

      const result = await service.getOnboardingState('u1');

      expect(result.onboardingStep).toBe(2);
      expect(result.email).toBe('alice@test.com');
    });
  });

  // ─── Refresh token management ─────────────────────────────────────────────

  describe('refresh token management', () => {
    it('deletes oldest tokens when limit of 5 is reached', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      // Simulate 5 existing tokens (limit is 5 → should delete oldest)
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt-old-1' }, { id: 'rt-old-2' }, { id: 'rt-old-3' },
        { id: 'rt-old-4' }, { id: 'rt-old-5' },
      ]);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });

      await service.initiateRegistration({ firstName: 'Alice', lastName: 'Dupont', email: 'alice@test.com', password: 'Password@1' });

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });
});
