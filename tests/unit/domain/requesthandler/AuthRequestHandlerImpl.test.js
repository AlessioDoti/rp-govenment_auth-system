import { jest } from '@jest/globals';
import { AuthRequestHandlerImpl } from '../../../../src/domain/requesthandler/AuthRequestHandlerImpl.js';
import { TokenResponseDTO } from '../../../../src/domain/dto/TokenResponseDTO.js';
import { UserDTO } from '../../../../src/domain/dto/UserDTO.js';
import { ValidationError, UnauthorizedError } from '../../../../src/domain/error/AppError.js';

describe('AuthRequestHandlerImpl', () => {
  let handler;
  let authService;

  function createMockAuthService() {
    return {
      authenticate: jest.fn(),
      refresh: jest.fn(),
      register: jest.fn(),
      validateToken: jest.fn(),
      userPersistenceService: {
        findByUuid: jest.fn(),
        listAll: jest.fn(),
        updateRoles: jest.fn()
      },
      refreshTokenPersistenceService: {
        revoke: jest.fn()
      }
    };
  }

  beforeEach(() => {
    authService = createMockAuthService();
    handler = new AuthRequestHandlerImpl(authService);
  });

  describe('handlePasswordGrant', () => {
    it('delegates to authService.authenticate on success', async () => {
      const expected = new TokenResponseDTO('access', 'refresh', 900);
      authService.authenticate.mockResolvedValue(expected);

      const result = await handler.handlePasswordGrant('mario', 'secret');

      expect(result).toBe(expected);
      expect(authService.authenticate).toHaveBeenCalledWith('mario', 'secret');
    });

    it('throws ValidationError when username is missing', async () => {
      await expect(handler.handlePasswordGrant('', 'secret')).rejects.toThrow(ValidationError);
      await expect(handler.handlePasswordGrant(null, 'secret')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when password is missing', async () => {
      await expect(handler.handlePasswordGrant('mario', '')).rejects.toThrow(ValidationError);
      await expect(handler.handlePasswordGrant('mario', null)).rejects.toThrow(ValidationError);
    });
  });

  describe('handleRefreshGrant', () => {
    it('delegates to authService.refresh on success', async () => {
      const expected = new TokenResponseDTO('new-access', 'new-refresh', 900);
      authService.refresh.mockResolvedValue(expected);

      const result = await handler.handleRefreshGrant('valid-refresh-token');

      expect(result).toBe(expected);
      expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('throws ValidationError when refresh token is missing', async () => {
      await expect(handler.handleRefreshGrant('')).rejects.toThrow(ValidationError);
      await expect(handler.handleRefreshGrant(null)).rejects.toThrow(ValidationError);
    });
  });

  describe('handleRegister', () => {
    it('delegates to authService.register', async () => {
      const expected = new UserDTO({ id: 1, username: 'newuser', email: 'new@test.it' });
      authService.register.mockResolvedValue(expected);

      const result = await handler.handleRegister('newuser', 'new@test.it', 'password123');

      expect(result).toBe(expected);
      expect(authService.register).toHaveBeenCalledWith('newuser', 'new@test.it', 'password123');
    });
  });

  describe('handleUserinfo', () => {
    it('returns safe JSON when user is found', async () => {
      const user = new UserDTO({ id: 1, username: 'mario', email: 'mario@test.it', roles: ['CITIZEN'], externalUuid: 'uuid-abc' });
      authService.userPersistenceService.findByUuid.mockResolvedValue(user);

      const result = await handler.handleUserinfo('uuid-abc');

      expect(result).toEqual({
        userId: 1,
        uuid: 'uuid-abc',
        username: 'mario',
        email: 'mario@test.it',
        roles: ['CITIZEN']
      });
    });

    it('throws UnauthorizedError when user is not found', async () => {
      authService.userPersistenceService.findByUuid.mockResolvedValue(null);

      await expect(handler.handleUserinfo('unknown-uuid')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('handleRevoke', () => {
    it('delegates to refreshTokenPersistenceService.revoke', async () => {
      await handler.handleRevoke('some-token');
      expect(authService.refreshTokenPersistenceService.revoke).toHaveBeenCalledWith('some-token');
    });
  });

  describe('handleListUsers', () => {
    it('returns safe JSON for all users', async () => {
      const users = [
        new UserDTO({ id: 1, username: 'alice', email: 'alice@test.it', roles: ['ADMIN'], externalUuid: 'u-1' }),
        new UserDTO({ id: 2, username: 'bob', email: 'bob@test.it', roles: ['CITIZEN'], externalUuid: 'u-2' })
      ];
      authService.userPersistenceService.listAll.mockResolvedValue(users);

      const result = await handler.handleListUsers();

      expect(result).toHaveLength(2);
      expect(result[0].uuid).toBe('u-1');
      expect(result[1].uuid).toBe('u-2');
      expect(result[0].passwordHash).toBeUndefined();
    });

    it('returns empty array when no users', async () => {
      authService.userPersistenceService.listAll.mockResolvedValue([]);
      const result = await handler.handleListUsers();
      expect(result).toEqual([]);
    });
  });

  describe('handleUpdateRoles', () => {
    it('updates roles and returns safe JSON', async () => {
      const updated = new UserDTO({ id: 1, username: 'mario', email: 'mario@test.it', roles: ['ADMIN', 'MANAGER'], externalUuid: 'uuid-abc' });
      authService.userPersistenceService.updateRoles.mockResolvedValue(updated);

      const result = await handler.handleUpdateRoles('uuid-abc', ['ADMIN', 'MANAGER']);

      expect(result).toEqual({
        userId: 1,
        uuid: 'uuid-abc',
        username: 'mario',
        email: 'mario@test.it',
        roles: ['ADMIN', 'MANAGER']
      });
      expect(authService.userPersistenceService.updateRoles).toHaveBeenCalledWith('uuid-abc', ['ADMIN', 'MANAGER']);
    });

    it('throws ValidationError when roles is empty array', async () => {
      await expect(handler.handleUpdateRoles('uuid-abc', [])).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when roles is not an array', async () => {
      await expect(handler.handleUpdateRoles('uuid-abc', null)).rejects.toThrow(ValidationError);
      await expect(handler.handleUpdateRoles('uuid-abc', 'ADMIN')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when a role is not a string', async () => {
      await expect(handler.handleUpdateRoles('uuid-abc', ['ADMIN', 123])).rejects.toThrow(ValidationError);
    });
  });
});
