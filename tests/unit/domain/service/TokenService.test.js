import jwt from 'jsonwebtoken';
import { TokenService } from '../../../../src/domain/service/TokenService.js';
import { UserDTO } from '../../../../src/domain/dto/UserDTO.js';

describe('TokenService', () => {
  let service;

  beforeEach(() => {
    service = new TokenService();
  });

  describe('createAccessToken', () => {
    it('signs a JWT with correct payload and options', () => {
      const user = new UserDTO({
        id: 1,
        username: 'mario',
        roles: ['CITIZEN'],
        externalUuid: 'uuid-abc'
      });

      const { token, expiresIn } = service.createAccessToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(expiresIn).toBe(900);

      const decoded = jwt.verify(token, 'test-secret-at-least-16-chars', { issuer: 'rp-auth-system-test' });
      expect(decoded.sub).toBe('uuid-abc');
      expect(decoded.username).toBe('mario');
      expect(decoded.roles).toEqual(['CITIZEN']);
      expect(decoded.userId).toBe(1);
    });

    it('returns expiresIn from env', () => {
      const user = new UserDTO({ id: 1, username: 'test', externalUuid: 'u-1' });
      const { expiresIn } = service.createAccessToken(user);
      expect(expiresIn).toBe(900);
    });
  });

  describe('verifyAccessToken', () => {
    it('returns decoded payload for valid token', () => {
      const user = new UserDTO({ id: 1, username: 'mario', roles: ['CITIZEN'], externalUuid: 'uuid-abc' });
      const { token } = service.createAccessToken(user);

      const payload = service.verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload.sub).toBe('uuid-abc');
      expect(payload.username).toBe('mario');
      expect(payload.roles).toEqual(['CITIZEN']);
    });

    it('returns null for invalid token', () => {
      const result = service.verifyAccessToken('invalid-token');
      expect(result).toBeNull();
    });

    it('returns null for expired token', () => {
      // Manually create an expired token
      const expiredToken = jwt.sign(
        { username: 'test', roles: [] },
        'test-secret-at-least-16-chars',
        { expiresIn: '0s', issuer: 'rp-auth-system-test', subject: 'u-1' }
      );
      const result = service.verifyAccessToken(expiredToken);
      expect(result).toBeNull();
    });

    it('returns null for token with wrong issuer', () => {
      const wrongToken = jwt.sign(
        { username: 'test', roles: [] },
        'test-secret-at-least-16-chars',
        { expiresIn: '1h', issuer: 'wrong-issuer', subject: 'u-1' }
      );
      const result = service.verifyAccessToken(wrongToken);
      expect(result).toBeNull();
    });

    it('returns null for token signed with different secret', () => {
      const wrongToken = jwt.sign(
        { username: 'test', roles: [] },
        'different-secret-1234567890',
        { expiresIn: '1h', issuer: 'rp-auth-system-test', subject: 'u-1' }
      );
      const result = service.verifyAccessToken(wrongToken);
      expect(result).toBeNull();
    });
  });

  describe('createRefreshTokenString', () => {
    it('returns a hex string of 96 characters (48 bytes)', () => {
      const token = service.createRefreshTokenString();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]{96}$/);
    });

    it('produces different tokens on each call', () => {
      const t1 = service.createRefreshTokenString();
      const t2 = service.createRefreshTokenString();
      expect(t1).not.toBe(t2);
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('returns a Date in the future', () => {
      const now = Date.now();
      const expiry = service.getRefreshTokenExpiry();
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(now);
    });

    it('returns about 30 days in the future by default', () => {
      const now = Date.now();
      const expiry = service.getRefreshTokenExpiry();
      const diffDays = (expiry.getTime() - now) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });
  });
});
