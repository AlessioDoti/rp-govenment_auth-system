import { jest } from '@jest/globals';
import { RefreshTokenPersistenceServiceImpl } from '../../../../src/persistence/service/RefreshTokenPersistenceServiceImpl.js';
import { RefreshToken } from '../../../../src/persistence/entity/RefreshToken.js';

describe('RefreshTokenPersistenceServiceImpl', () => {
  let service;
  let refreshTokenRepository;

  beforeEach(() => {
    refreshTokenRepository = {
      save: jest.fn(),
      findValid: jest.fn(),
      revoke: jest.fn()
    };
    service = new RefreshTokenPersistenceServiceImpl(refreshTokenRepository);
  });

  describe('save', () => {
    it('delegates to repository', async () => {
      const date = new Date();
      refreshTokenRepository.save.mockResolvedValue(undefined);

      await service.save(1, 'token-123', date);

      expect(refreshTokenRepository.save).toHaveBeenCalledWith(1, 'token-123', date);
    });
  });

  describe('findValid', () => {
    it('returns mapped object when token is found', async () => {
      const entity = new RefreshToken({
        id: 1,
        userId: 1,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 86400000),
        revoked: 0,
        createdAt: new Date()
      });
      refreshTokenRepository.findValid.mockResolvedValue(entity);

      const result = await service.findValid('valid-token');

      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.token).toBe('valid-token');
      expect(result.revoked).toBe(false);
    });

    it('returns null when not found', async () => {
      refreshTokenRepository.findValid.mockResolvedValue(null);
      expect(await service.findValid('ghost')).toBeNull();
    });

    it('converts revoked=1 to boolean true', async () => {
      const entity = new RefreshToken({ id: 1, userId: 1, token: 't', expiresAt: new Date(), revoked: 1 });
      refreshTokenRepository.findValid.mockResolvedValue(entity);
      const result = await service.findValid('t');
      expect(result.revoked).toBe(true);
    });

    it('converts revoked=true to boolean true', async () => {
      const entity = new RefreshToken({ id: 1, userId: 1, token: 't', expiresAt: new Date(), revoked: true });
      refreshTokenRepository.findValid.mockResolvedValue(entity);
      const result = await service.findValid('t');
      expect(result.revoked).toBe(true);
    });
  });

  describe('revoke', () => {
    it('delegates to repository', async () => {
      refreshTokenRepository.revoke.mockResolvedValue(undefined);

      await service.revoke('token-to-revoke');

      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('token-to-revoke');
    });
  });
});
