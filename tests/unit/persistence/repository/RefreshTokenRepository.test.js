import { jest } from '@jest/globals';
import { RefreshTokenRepository } from '../../../../src/persistence/repository/RefreshTokenRepository.js';
import { RefreshToken } from '../../../../src/persistence/entity/RefreshToken.js';

function makeMockPool(handlers) {
  const query = jest.fn(async (sql, params) => {
    for (const { match, rows } of handlers) {
      if (match(sql, params)) return [rows, []];
    }
    throw new Error(`Unexpected query in mock pool: ${sql}`);
  });
  return { query };
}

const includes = (substring) => (sql) => sql.includes(substring);

describe('RefreshTokenRepository', () => {
  describe('save', () => {
    it('inserts a refresh token and returns the entity', async () => {
      const pool = makeMockPool([
        { match: includes('INSERT INTO REFRESH_TOKENS'), rows: [{ insertId: 1 }] },
        { match: includes('FROM REFRESH_TOKENS WHERE id = ?'), rows: [
          { id: 1, USER_ID: 1, TOKEN: 'token-123', EXPIRES_AT: new Date(), REVOKED: 0, CREATED_AT: new Date() }
        ] }
      ]);
      const repo = new RefreshTokenRepository(pool);
      const result = await repo.save(1, 'token-123', new Date());

      expect(result).toBeInstanceOf(RefreshToken);
      expect(result.id).toBe(1);
      expect(result.token).toBe('token-123');
      expect(result.userId).toBe(1);
    });
  });

  describe('findValid', () => {
    it('returns a RefreshToken when valid token found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM REFRESH_TOKENS WHERE TOKEN = ?'), rows: [
          { id: 1, USER_ID: 1, TOKEN: 'valid-token', EXPIRES_AT: new Date(Date.now() + 86400000), REVOKED: 0, CREATED_AT: new Date() }
        ] }
      ]);
      const repo = new RefreshTokenRepository(pool);
      const result = await repo.findValid('valid-token');

      expect(result).toBeInstanceOf(RefreshToken);
      expect(result.token).toBe('valid-token');
      expect(result.revoked).toBe(0);
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM REFRESH_TOKENS WHERE TOKEN = ?'), rows: [] }
      ]);
      const repo = new RefreshTokenRepository(pool);
      expect(await repo.findValid('ghost-token')).toBeNull();
    });
  });

  describe('revoke', () => {
    it('updates REVOKED to 1', async () => {
      let updated = false;
      const pool = {
        query: jest.fn(async (sql, params) => {
          if (sql.includes('UPDATE REFRESH_TOKENS SET REVOKED = 1')) {
            updated = true;
            expect(params).toEqual(['token-to-revoke']);
          }
          return [{ affectedRows: 1 }, []];
        })
      };
      const repo = new RefreshTokenRepository(pool);
      await repo.revoke('token-to-revoke');
      expect(updated).toBe(true);
    });
  });
});
