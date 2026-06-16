import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid slow hashing in tests
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_access_token'),
  verify: jest.fn(),
};

const mockMailService = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    const map: Record<string, string> = {
      FRONTEND_URL: 'http://localhost:4000',
    };
    return map[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuthService(
      prisma as any,
      mockJwtService as any,
      mockMailService as any,
      mockConfig as any,
    );
    jest.clearAllMocks();
  });

  // ─── validateUser ─────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user without password when credentials are valid', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        password: 'hashed',
        emailVerified: true,
        memberships: [],
      };
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@test.com');
    });

    it('returns null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('unknown@test.com', 'password');
      expect(result).toBeNull();
    });

    it('returns null when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        password: 'hashed',
        memberships: [],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });
  });

  // ─── login ────────────────────────────────────────────────────────────

  describe('login', () => {
    const verifiedUser = {
      id: 'u1',
      email: 'test@test.com',
      name: 'Test',
      emailVerified: true,
      memberships: [{ role: 'owner', tenantId: 'tenant-1' }],
      platformRole: 'user',
      tenantId: 'tenant-1',
    };

    it('returns tokens for verified user', async () => {
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await service.login(verifiedUser);

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('throws UnauthorizedException when email not verified', async () => {
      const unverifiedUser = { ...verifiedUser, emailVerified: false };

      await expect(service.login(unverifiedUser)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(unverifiedUser)).rejects.toThrow(
        'Veuillez vérifier votre adresse email',
      );
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks email as verified and clears the token', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        emailVerificationToken: 'valid_token',
        emailVerificationExpiry: new Date(Date.now() + 3_600_000), // 1h from now
      };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, emailVerified: true });

      const result = await service.verifyEmail('valid_token');

      expect(result.message).toContain('vérifié');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
    });

    it('throws UnauthorizedException for expired token', async () => {
      // findFirst returns null when expiry has passed (Prisma filters it out)
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('expired_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for unknown token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('unknown_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── resendVerificationEmail ───────────────────────────────────────────

  describe('resendVerificationEmail', () => {
    it('sends a new verification email for unverified user', async () => {
      const user = {
        id: 'u1',
        name: 'Test',
        email: 'test@test.com',
        emailVerified: false,
      };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.resendVerificationEmail('test@test.com');

      expect(mockMailService.sendEmailVerification).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@test.com' }),
      );
      expect(result.message).toBeDefined();
    });

    it('returns same message for non-existent email (anti-enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationEmail('ghost@test.com');

      expect(mockMailService.sendEmailVerification).not.toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('returns same message for already verified user (anti-enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        emailVerified: true,
      });

      const result = await service.resendVerificationEmail('verified@test.com');

      expect(mockMailService.sendEmailVerification).not.toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('sends reset email for existing user', async () => {
      const user = { id: 'u1', email: 'test@test.com', name: 'Test' };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await service.forgotPassword('test@test.com');

      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@test.com' }),
      );
    });

    it('returns same message for non-existent email (anti-enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('ghost@test.com');

      expect(mockMailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(result.message).toContain('Si cet email');
    });
  });

  // ─── refreshAccessToken ───────────────────────────────────────────────

  describe('refreshAccessToken', () => {
    it('rotates refresh token on successful refresh', async () => {
      const stored = {
        id: 'rt1',
        tokenHash: 'some_hash',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 86_400_000),
        user: {
          id: 'u1',
          email: 'test@test.com',
          platformRole: 'user',
          tenantId: 'tenant-1',
          memberships: [{ role: 'owner', tenantId: 'tenant-1' }],
        },
      };
      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.refreshToken.delete.mockResolvedValue(stored);
      prisma.refreshToken.findMany.mockResolvedValue([]);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt2' });

      const result = await service.refreshAccessToken('valid_raw_token');

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      // Old token was deleted (rotation)
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt1' },
      });
    });

    it('throws UnauthorizedException for expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        expiresAt: new Date(Date.now() - 1000), // expired
      });
      prisma.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshAccessToken('expired_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for unknown refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken('unknown_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('hashes new password and revokes all refresh tokens', async () => {
      const user = { id: 'u1', email: 'test@test.com' };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.resetPassword('valid_token', 'NewPassword@123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
            passwordResetToken: null,
          }),
        }),
      );
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('throws BadRequestException for invalid reset token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid_token', 'NewPassword@123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
