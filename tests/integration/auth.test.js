import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/persistence/db.js', () => ({
  getPool: jest.fn(() => ({
    getConnection: jest.fn().mockResolvedValue({
      ping: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    }),
    query: jest.fn()
  })),
  closePool: jest.fn(),
  ping: jest.fn().mockResolvedValue(true)
}));

const { createApp } = await import('../../src/app.js');
const { TokenService } = await import('../../src/domain/service/TokenService.js');
const { AuthRequestHandlerImpl } = await import('../../src/domain/requesthandler/AuthRequestHandlerImpl.js');
const { UserDTOFactory } = await import('../../src/rest/factory/UserDTOFactory.js');
const { UserDTO } = await import('../../src/domain/dto/UserDTO.js');
const { TokenResponseDTO } = await import('../../src/domain/dto/TokenResponseDTO.js');
const { UnauthorizedError, ValidationError, ConflictError } = await import('../../src/domain/error/AppError.js');

function buildInMemoryContainer() {
  const tokenService = new TokenService();

  const authService = {
    authenticate: jest.fn(),
    refresh: jest.fn(),
    register: jest.fn(),
    validateToken: jest.fn((token) => tokenService.verifyAccessToken(token)),
    userPersistenceService: {
      findByUuid: jest.fn(),
      listAll: jest.fn(),
      updateRoles: jest.fn()
    },
    refreshTokenPersistenceService: {
      revoke: jest.fn()
    }
  };

  const authRequestHandler = new AuthRequestHandlerImpl(authService);
  const userDTOFactory = new UserDTOFactory();

  return {
    container: {
      pool: {},
      mappers: {},
      repositories: {},
      persistence: {},
      services: { tokenService, authService },
      handlers: { authRequestHandler },
      factories: { userDTOFactory }
    },
    authService
  };
}

describe('HTTP integration (Supertest, in-memory container)', () => {
  let app;
  let authService;

  beforeEach(() => {
    const built = buildInMemoryContainer();
    authService = built.authService;
    ({ app } = createApp({ container: built.container }));
  });

  describe('POST /auth/token', () => {
    it('returns 200 with token pair for valid password grant', async () => {
      const tokenResponse = new TokenResponseDTO('access-token', 'refresh-token', 900);
      authService.authenticate.mockResolvedValue(tokenResponse);

      const res = await request(app)
        .post('/auth/token')
        .send({ grant_type: 'password', username: 'mario', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBe('access-token');
      expect(res.body.refresh_token).toBe('refresh-token');
      expect(res.body.token_type).toBe('Bearer');
      expect(res.body.expires_in).toBe(900);
    });

    it('returns 400 for unsupported grant_type', async () => {
      const res = await request(app)
        .post('/auth/token')
        .send({ grant_type: 'client_credentials' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_GRANT');
    });

    it('returns 400 for missing grant_type', async () => {
      const res = await request(app)
        .post('/auth/token')
        .send({ username: 'mario', password: 'secret' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_GRANT');
    });

    it('returns 200 for valid refresh grant', async () => {
      const tokenResponse = new TokenResponseDTO('new-access', 'new-refresh', 900);
      authService.refresh.mockResolvedValue(tokenResponse);

      const res = await request(app)
        .post('/auth/token')
        .send({ grant_type: 'refresh_token', refresh_token: 'valid-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBe('new-access');
    });

    it('returns 401 for invalid refresh token', async () => {
      authService.refresh.mockRejectedValue(new UnauthorizedError('Invalid or expired refresh token'));

      const res = await request(app)
        .post('/auth/token')
        .send({ grant_type: 'refresh_token', refresh_token: 'bad-token' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /auth/register', () => {
    it('returns 201 with user safe JSON on success', async () => {
      const user = new UserDTO({
        id: 1,
        username: 'newuser',
        email: 'new@test.it',
        roles: ['CITIZEN'],
        enabled: true,
        externalUuid: 'new-uuid'
      });
      authService.register.mockResolvedValue(user);

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'newuser', email: 'new@test.it', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.uuid).toBe('new-uuid');
      expect(res.body.username).toBe('newuser');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('returns 400 when validation fails', async () => {
      authService.register.mockRejectedValue(
        new ValidationError('Validation failed', ['username: Username must be at least 3 characters'])
      );

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'ab', email: 'invalid', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 when username is already taken', async () => {
      authService.register.mockRejectedValue(
        new ConflictError("Username 'existing' is already taken")
      );

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'existing', email: 'existing@test.it', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /auth/userinfo', () => {
    let validToken;

    beforeEach(() => {
      const tokenService = new TokenService();
      const user = new UserDTO({ id: 1, username: 'mario', roles: ['CITIZEN'], externalUuid: 'user-uuid' });
      validToken = tokenService.createAccessToken(user).token;
    });

    it('returns 200 with safe user data for valid token', async () => {
      authService.userPersistenceService.findByUuid.mockResolvedValue(
        new UserDTO({ id: 1, username: 'mario', email: 'mario@test.it', roles: ['CITIZEN'], externalUuid: 'user-uuid' })
      );

      const res = await request(app)
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.uuid).toBe('user-uuid');
      expect(res.body.username).toBe('mario');
    });

    it('returns 401 without Authorization header', async () => {
      const res = await request(app).get('/auth/userinfo');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/userinfo')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /auth/users', () => {
    let adminToken;
    let citizenToken;

    beforeEach(() => {
      const tokenService = new TokenService();
      const admin = new UserDTO({ id: 1, username: 'admin', roles: ['ADMIN'], externalUuid: 'admin-uuid' });
      const citizen = new UserDTO({ id: 2, username: 'user', roles: ['CITIZEN'], externalUuid: 'user-uuid' });
      adminToken = tokenService.createAccessToken(admin).token;
      citizenToken = tokenService.createAccessToken(citizen).token;
    });

    it('returns 200 with user list for admin', async () => {
      authService.userPersistenceService.listAll.mockResolvedValue([
        new UserDTO({ id: 1, username: 'admin', email: 'admin@test.it', roles: ['ADMIN'], externalUuid: 'admin-uuid' }),
        new UserDTO({ id: 2, username: 'user', email: 'user@test.it', roles: ['CITIZEN'], externalUuid: 'user-uuid' })
      ]);

      const res = await request(app)
        .get('/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('returns 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/auth/users')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/auth/users');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /auth/users/:uuid/roles', () => {
    let adminToken;
    let citizenToken;

    beforeEach(() => {
      const tokenService = new TokenService();
      const admin = new UserDTO({ id: 1, username: 'admin', roles: ['ADMIN'], externalUuid: 'admin-uuid' });
      const citizen = new UserDTO({ id: 2, username: 'user', roles: ['CITIZEN'], externalUuid: 'user-uuid' });
      adminToken = tokenService.createAccessToken(admin).token;
      citizenToken = tokenService.createAccessToken(citizen).token;
    });

    it('returns 200 with updated user for admin', async () => {
      authService.userPersistenceService.updateRoles.mockResolvedValue(
        new UserDTO({ id: 2, username: 'user', email: 'user@test.it', roles: ['ADMIN', 'MANAGER'], externalUuid: 'user-uuid' })
      );

      const res = await request(app)
        .patch('/auth/users/user-uuid/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['ADMIN', 'MANAGER'] });

      expect(res.status).toBe(200);
      expect(res.body.roles).toEqual(['ADMIN', 'MANAGER']);
    });

    it('returns 403 for non-admin user', async () => {
      const res = await request(app)
        .patch('/auth/users/user-uuid/roles')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ roles: ['ADMIN'] });

      expect(res.status).toBe(403);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/auth/users/uuid/roles')
        .send({ roles: ['ADMIN'] });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/revoke', () => {
    let validToken;

    beforeEach(() => {
      const tokenService = new TokenService();
      const user = new UserDTO({ id: 1, username: 'mario', roles: ['CITIZEN'], externalUuid: 'user-uuid' });
      validToken = tokenService.createAccessToken(user).token;
    });

    it('returns 200 when token is revoked', async () => {
      const res = await request(app)
        .post('/auth/revoke')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ refresh_token: 'token-to-revoke' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Token revoked');
      expect(authService.refreshTokenPersistenceService.revoke).toHaveBeenCalledWith('token-to-revoke');
    });

    it('returns 400 when refresh_token is missing', async () => {
      const res = await request(app)
        .post('/auth/revoke')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_REQUEST');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/auth/revoke')
        .send({ refresh_token: 'token' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBe('up');
    });
  });

  describe('Global error handler', () => {
    it('returns 404 for unknown route', async () => {
      const res = await request(app).get('/unknown-route');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
