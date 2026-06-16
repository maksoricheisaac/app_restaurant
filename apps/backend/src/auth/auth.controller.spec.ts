import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockAuthService = {
  login: jest.fn(),
  getProfile: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  revokeRefreshToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  getAllUsers: jest.fn(),
  updateUserPlatformRole: jest.fn(),
  updateUserStatus: jest.fn(),
};

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('sets auth cookies and returns user object', async () => {
      const user = { id: 'u1', email: 'test@test.com', platformRole: 'user' };
      mockAuthService.login.mockResolvedValue({
        access_token: 'access_tok',
        refresh_token: 'refresh_tok',
        user,
      });
      const req: any = { user };
      const res = mockResponse();

      const result = await controller.login(req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'access_tok',
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh_tok',
        expect.any(Object),
      );
      expect(result).toEqual({ user });
    });
  });

  // ─── refresh ────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws 401 when refreshToken cookie is missing', async () => {
      const req: any = { cookies: {} };
      const res = mockResponse();
      await expect(controller.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues new cookies on valid refresh token', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({
        access_token: 'new_access',
        refresh_token: 'new_refresh',
      });
      const req: any = { cookies: { refreshToken: 'raw_refresh_token' } };
      const res = mockResponse();

      const result = await controller.refresh(req, res);

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
        'raw_refresh_token',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'new_access',
        expect.any(Object),
      );
      expect(result).toEqual({ ok: true });
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes refresh token and clears cookies', async () => {
      mockAuthService.revokeRefreshToken.mockResolvedValue(undefined);
      const req: any = { cookies: { refreshToken: 'raw_tok' } };
      const res = mockResponse();

      await controller.logout(req, res);

      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith(
        'raw_tok',
      );
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
    });

    it('clears cookies even when no refresh token present', async () => {
      const req: any = { cookies: {} };
      const res = mockResponse();
      await controller.logout(req, res);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  // ─── getProfile ─────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns the authenticated user profile', async () => {
      const profile = { id: 'u1', email: 'a@b.com', role: 'owner' };
      mockAuthService.getProfile.mockResolvedValue(profile);
      const req: any = { user: { id: 'u1' } };

      const result = await controller.getProfile(req);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual(profile);
    });
  });

  // ─── verifyEmail ────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('calls authService.verifyEmail with the token', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'ok' });
      const result = await controller.verifyEmail('abc123');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('abc123');
      expect(result).toEqual({ message: 'ok' });
    });

    it('throws 401 when token is missing', () => {
      expect(() => controller.verifyEmail('')).toThrow(UnauthorizedException);
    });
  });

  // ─── forgotPassword ─────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('delegates to authService.forgotPassword', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'sent' });
      const result = await controller.forgotPassword({
        email: 'a@b.com',
      } as any);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('a@b.com');
      expect(result).toEqual({ message: 'sent' });
    });
  });

  // ─── resetPassword ──────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('delegates to authService.resetPassword', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'done' });
      const result = await controller.resetPassword({
        token: 'tok',
        password: 'pass',
      } as any);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('tok', 'pass');
      expect(result).toEqual({ message: 'done' });
    });
  });
});
