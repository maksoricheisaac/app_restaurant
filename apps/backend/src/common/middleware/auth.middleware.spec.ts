import { AuthMiddleware } from './auth.middleware';

const mockJwtService = {
  verify: jest.fn(),
};

function makeReq(
  overrides: {
    authHeader?: string;
    cookie?: string;
  } = {},
) {
  return {
    headers: {
      ...(overrides.authHeader ? { authorization: overrides.authHeader } : {}),
    },
    cookies: overrides.cookie ? { token: overrides.cookie } : {},
  } as any;
}

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  const next = jest.fn();
  const res = {} as any;

  beforeEach(() => {
    middleware = new AuthMiddleware(mockJwtService as any);
    jest.clearAllMocks();
  });

  // ─── Token extraction ─────────────────────────────────────────────────────

  it('extracts token from Authorization: Bearer header', () => {
    const req = makeReq({ authHeader: 'Bearer valid.token.here' });
    mockJwtService.verify.mockReturnValue({
      sub: 'u1',
      email: 'a@b.com',
      role: 'owner',
      platformRole: 'user',
    });

    middleware.use(req, res, next);

    expect(mockJwtService.verify).toHaveBeenCalledWith('valid.token.here');
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('extracts token from cookie when no Authorization header', () => {
    const req = makeReq({ cookie: 'cookie.token.here' });
    mockJwtService.verify.mockReturnValue({
      sub: 'u2',
      email: 'b@c.com',
      role: 'manager',
      platformRole: 'user',
    });

    middleware.use(req, res, next);

    expect(mockJwtService.verify).toHaveBeenCalledWith('cookie.token.here');
    expect(req.user.id).toBe('u2');
  });

  it('prefers Authorization header over cookie', () => {
    const req = makeReq({
      authHeader: 'Bearer header.token',
      cookie: 'cookie.token',
    });
    mockJwtService.verify.mockReturnValue({
      sub: 'u3',
      email: 'c@d.com',
      role: 'owner',
      platformRole: 'user',
    });

    middleware.use(req, res, next);

    expect(mockJwtService.verify).toHaveBeenCalledWith('header.token');
  });

  // ─── Invalid / missing tokens ─────────────────────────────────────────────

  it('does not set req.user when no token is present', () => {
    const req = makeReq();
    middleware.use(req, res, next);

    expect(mockJwtService.verify).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('does not throw and does not set req.user for invalid token', () => {
    const req = makeReq({ authHeader: 'Bearer invalid.token' });
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => middleware.use(req, res, next)).not.toThrow();
    expect(req.user).toBeUndefined();
  });

  it('does not throw for expired token', () => {
    const req = makeReq({ cookie: 'expired.token' });
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('TokenExpiredError');
    });

    expect(() => middleware.use(req, res, next)).not.toThrow();
    expect(req.user).toBeUndefined();
  });

  // ─── Always calls next() ──────────────────────────────────────────────────

  it('always calls next() — even with invalid token', () => {
    const req = makeReq({ authHeader: 'Bearer bad' });
    mockJwtService.verify.mockImplementation(() => {
      throw new Error();
    });

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('always calls next() — even with no token', () => {
    const req = makeReq();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('always calls next() — even with valid token', () => {
    const req = makeReq({ cookie: 'good.token' });
    mockJwtService.verify.mockReturnValue({
      sub: 'u1',
      email: 'a@b.com',
      role: 'owner',
      platformRole: 'user',
    });

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  // ─── req.user shape ───────────────────────────────────────────────────────

  it('ne retient que l’identité du porteur du jeton', () => {
    const req = makeReq({ cookie: 'tok' });
    mockJwtService.verify.mockReturnValue({
      sub: 'user-uuid',
      email: 'test@example.com',
      role: 'cashier',
      platformRole: 'user',
    });

    middleware.use(req, res, next);

    // Le rôle est délibérément absent : AuthGuard le relit en base.
    expect(req.user).toStrictEqual({
      id: 'user-uuid',
      email: 'test@example.com',
    });
  });
});
