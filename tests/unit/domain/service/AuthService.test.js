import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { AuthService } from '../../../../src/domain/service/AuthService.js';
import { TokenService } from '../../../../src/domain/service/TokenService.js';
import { UserDTO } from '../../../../src/domain/dto/UserDTO.js';
import { TokenResponseDTO } from '../../../../src/domain/dto/TokenResponseDTO.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../../../../src/domain/error/AppError.js';

describe('AuthService', () => {
  let authService;
  let userPersistenceService;
  let refreshTokenPersistenceService;
  let tokenService;

  function createUserDto(overrides = {}) {
    return new UserDTO({
      id: 1,
      username: 'mario',
      email: 'mario@test.it',
      passwordHash: '$2b$12$hashedpassword123',
      roles: ['CITIZEN'],
      enabled: true,
      externalUuid: 'uuid-abc',
      ...overrides
    });
  }

  beforeEach(() => {
    tokenService = new TokenService();
    userPersistenceService = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findByUuid: jest.fn(),
      findByInternalId: jest.fn(),
      listAll: jest.fn(),
      saveUser: jest.fn(),
      updateRoles: jest.fn()
    };
    refreshTokenPersistenceService = {
      save: jest.fn(),
      findValid: jest.fn(),
      revoke: jest.fn()
    };
    authService = new AuthService(userPersistenceService, refreshTokenPersistenceService, tokenService);
  });

  describe('register', () => {
    it('creates a new user with CITIZEN role', async () => {
      userPersistenceService.findByUsername.mockResolvedValue(null);
      userPersistenceService.findByEmail.mockResolvedValue(null);
      const savedDto = createUserDto({ id: 2, externalUuid: 'new-uuid' });
      userPersistenceService.saveUser.mockResolvedValue(savedDto);

      const result = await authService.register('mario', 'mario@test.it', 'password123');

      expect(result).toBe(savedDto);
      expect(userPersistenceService.findByUsername).toHaveBeenCalledWith('mario');
      expect(userPersistenceService.findByEmail).toHaveBeenCalledWith('mario@test.it');
      expect(userPersistenceService.saveUser).toHaveBeenCalledTimes(1);

      const savedArg = userPersistenceService.saveUser.mock.calls[0][0];
      expect(savedArg).toBeInstanceOf(UserDTO);
      expect(savedArg.username).toBe('mario');
      expect(savedArg.email).toBe('mario@test.it');
      expect(savedArg.roles).toEqual(['CITIZEN']);
      expect(savedArg.enabled).toBe(true);
      expect(savedArg.externalUuid).toBeDefined();
      expect(savedArg.passwordHash).toBeDefined();
      expect(savedArg.passwordHash).not.toBe('password123');
    });

    it('throws ConflictError when username already exists', async () => {
      userPersistenceService.findByUsername.mockResolvedValue(createUserDto());

      await expect(
        authService.register('mario', 'mario@test.it', 'password123')
      ).rejects.toThrow(ConflictError);

      expect(userPersistenceService.findByEmail).not.toHaveBeenCalled();
      expect(userPersistenceService.saveUser).not.toHaveBeenCalled();
    });

    it('throws ConflictError when email already exists', async () => {
      userPersistenceService.findByUsername.mockResolvedValue(null);
      userPersistenceService.findByEmail.mockResolvedValue(createUserDto());

      await expect(
        authService.register('mario', 'mario@test.it', 'password123')
      ).rejects.toThrow(ConflictError);

      expect(userPersistenceService.saveUser).not.toHaveBeenCalled();
    });

    it('throws ValidationError for invalid input', async () => {
      await expect(
        authService.register('ab', 'invalid', 'short')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('authenticate', () => {
    it('returns TokenResponseDTO for valid credentials', async () => {
      const user = createUserDto();
      userPersistenceService.findByUsername.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(tokenService, 'createRefreshTokenString').mockReturnValue('refresh-token-123');
      const futureDate = new Date(Date.now() + 86400000);
      jest.spyOn(tokenService, 'getRefreshTokenExpiry').mockReturnValue(futureDate);
      refreshTokenPersistenceService.save.mockResolvedValue();

      const result = await authService.authenticate('mario', 'password123');

      expect(result).toBeInstanceOf(TokenResponseDTO);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.expiresIn).toBe(900);
      expect(refreshTokenPersistenceService.save).toHaveBeenCalledWith(1, 'refresh-token-123', futureDate);
    });

    it('throws UnauthorizedError when user not found', async () => {
      userPersistenceService.findByUsername.mockResolvedValue(null);

      await expect(
        authService.authenticate('unknown', 'pwd')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when account is disabled', async () => {
      const user = createUserDto({ enabled: false });
      userPersistenceService.findByUsername.mockResolvedValue(user);

      await expect(
        authService.authenticate('mario', 'password123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when password does not match', async () => {
      const user = createUserDto();
      userPersistenceService.findByUsername.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        authService.authenticate('mario', 'wrong-password')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refresh', () => {
    it('returns a new TokenResponseDTO with rotated token', async () => {
      const storedToken = { id: 1, userId: 1, token: 'old-refresh', expiresAt: new Date(Date.now() + 86400000), revoked: false };
      refreshTokenPersistenceService.findValid.mockResolvedValue(storedToken);
      userPersistenceService.findByInternalId.mockResolvedValue(createUserDto());
      refreshTokenPersistenceService.revoke.mockResolvedValue();
      jest.spyOn(tokenService, 'createRefreshTokenString').mockReturnValue('new-refresh-token');
      const futureDate = new Date(Date.now() + 86400000);
      jest.spyOn(tokenService, 'getRefreshTokenExpiry').mockReturnValue(futureDate);
      refreshTokenPersistenceService.save.mockResolvedValue();

      const result = await authService.refresh('old-refresh');

      expect(result).toBeInstanceOf(TokenResponseDTO);
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(refreshTokenPersistenceService.revoke).toHaveBeenCalledWith('old-refresh');
      expect(refreshTokenPersistenceService.save).toHaveBeenCalledWith(1, 'new-refresh-token', futureDate);
    });

    it('throws UnauthorizedError when refresh token is invalid', async () => {
      refreshTokenPersistenceService.findValid.mockResolvedValue(null);

      await expect(
        authService.refresh('invalid-token')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user is not found and revokes token', async () => {
      const storedToken = { id: 1, userId: 99, token: 'orphan-token', expiresAt: new Date(), revoked: false };
      refreshTokenPersistenceService.findValid.mockResolvedValue(storedToken);
      userPersistenceService.findByInternalId.mockResolvedValue(null);

      await expect(
        authService.refresh('orphan-token')
      ).rejects.toThrow(UnauthorizedError);

      expect(refreshTokenPersistenceService.revoke).toHaveBeenCalledWith('orphan-token');
    });

    it('throws UnauthorizedError when user is disabled and revokes token', async () => {
      const storedToken = { id: 1, userId: 1, token: 'disabled-user-token', expiresAt: new Date(), revoked: false };
      refreshTokenPersistenceService.findValid.mockResolvedValue(storedToken);
      userPersistenceService.findByInternalId.mockResolvedValue(createUserDto({ enabled: false }));

      await expect(
        authService.refresh('disabled-user-token')
      ).rejects.toThrow(UnauthorizedError);

      expect(refreshTokenPersistenceService.revoke).toHaveBeenCalledWith('disabled-user-token');
    });
  });

  describe('validateToken', () => {
    it('delegates to tokenService.verifyAccessToken', () => {
      const spy = jest.spyOn(tokenService, 'verifyAccessToken').mockReturnValue({ sub: 'u-1', username: 'mario', roles: ['CITIZEN'] });
      const result = authService.validateToken('some-token');
      expect(spy).toHaveBeenCalledWith('some-token');
      expect(result).toEqual({ sub: 'u-1', username: 'mario', roles: ['CITIZEN'] });
    });

    it('returns null for invalid token', () => {
      const result = authService.validateToken('bad-token');
      expect(result).toBeNull();
    });
  });
});
