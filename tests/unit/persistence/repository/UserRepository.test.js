import { jest } from '@jest/globals';
import { UserRepository } from '../../../../src/persistence/repository/UserRepository.js';
import { User } from '../../../../src/persistence/entity/User.js';

function makeMockPool(handlers) {
  const calls = [];
  const query = jest.fn(async (sql, params) => {
    calls.push({ sql, params });
    for (const { match, rows } of handlers) {
      if (match(sql, params)) return [rows, []];
    }
    throw new Error(`Unexpected query in mock pool: ${sql}`);
  });
  return { query, calls };
}

const includes = (substring) => (sql) => sql.includes(substring);

describe('UserRepository', () => {
  describe('findById', () => {
    it('returns a User entity when found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE id = ?'), rows: [
          { id: 1, USERNAME: 'mario', EMAIL: 'mario@test.it', PASSWORD_HASH: 'hash', ENABLED: 1, EXTERNAL_UUID: 'u-1', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const result = await repo.findById(1);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.username).toBe('mario');
      expect(result.email).toBe('mario@test.it');
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE id = ?'), rows: [] }
      ]);
      const repo = new UserRepository(pool);
      expect(await repo.findById(999)).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('returns a User entity when found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE USERNAME = ?'), rows: [
          { id: 2, USERNAME: 'luigi', EMAIL: 'luigi@test.it', PASSWORD_HASH: 'hash', ENABLED: 1, EXTERNAL_UUID: 'u-2', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const result = await repo.findByUsername('luigi');

      expect(result).toBeInstanceOf(User);
      expect(result.username).toBe('luigi');
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE USERNAME = ?'), rows: [] }
      ]);
      const repo = new UserRepository(pool);
      expect(await repo.findByUsername('ghost')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns a User entity when found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE EMAIL = ?'), rows: [
          { id: 3, USERNAME: 'anna', EMAIL: 'anna@test.it', PASSWORD_HASH: 'hash', ENABLED: 1, EXTERNAL_UUID: 'u-3', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const result = await repo.findByEmail('anna@test.it');
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe('anna@test.it');
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE EMAIL = ?'), rows: [] }
      ]);
      const repo = new UserRepository(pool);
      expect(await repo.findByEmail('missing@test.it')).toBeNull();
    });
  });

  describe('findByExternalUuid', () => {
    it('returns a User entity when found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE EXTERNAL_UUID = ?'), rows: [
          { id: 1, USERNAME: 'ext', EMAIL: 'ext@test.it', PASSWORD_HASH: 'hash', ENABLED: 1, EXTERNAL_UUID: 'ext-uuid', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const result = await repo.findByExternalUuid('ext-uuid');
      expect(result).toBeInstanceOf(User);
      expect(result.externalUuid).toBe('ext-uuid');
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS WHERE EXTERNAL_UUID = ?'), rows: [] }
      ]);
      const repo = new UserRepository(pool);
      expect(await repo.findByExternalUuid('unknown')).toBeNull();
    });
  });

  describe('save', () => {
    it('inserts a new user and returns it with generated id', async () => {
      const pool = makeMockPool([
        { match: includes('INSERT INTO USERS'), rows: [{ insertId: 100 }] },
        { match: includes('FROM USERS WHERE id = ?'), rows: [
          { id: 100, USERNAME: 'newuser', EMAIL: 'new@test.it', PASSWORD_HASH: 'hash', ENABLED: 1, EXTERNAL_UUID: 'new-uuid', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const user = new User({ username: 'newuser', email: 'new@test.it', passwordHash: 'hash', enabled: 1, externalUuid: 'new-uuid' });

      const result = await repo.save(user);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(100);
      expect(result.username).toBe('newuser');
    });

    it('updates an existing user and returns it via findById', async () => {
      const pool = makeMockPool([
        { match: includes('UPDATE USERS SET'), rows: [] },
        { match: includes('FROM USERS WHERE id = ?'), rows: [
          { id: 1, USERNAME: 'updated', EMAIL: 'updated@test.it', PASSWORD_HASH: 'newhash', ENABLED: 1, EXTERNAL_UUID: 'u-1', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const user = new User({ id: 1, username: 'updated', email: 'updated@test.it', passwordHash: 'newhash', enabled: 1, externalUuid: 'u-1' });

      const result = await repo.save(user);
      expect(result.id).toBe(1);
      expect(result.username).toBe('updated');

      const updateCall = pool.calls.find((c) => c.sql.trimStart().startsWith('UPDATE'));
      expect(updateCall).toBeDefined();
      expect(updateCall.params).toEqual(['updated', 'updated@test.it', 'newhash', 1, 'u-1', 1]);
    });
  });

  describe('listAll', () => {
    it('returns all users ordered by username', async () => {
      const pool = makeMockPool([
        { match: includes('ORDER BY USERNAME ASC'), rows: [
          { id: 1, USERNAME: 'anna', EMAIL: 'anna@test.it', PASSWORD_HASH: 'h1', ENABLED: 1, EXTERNAL_UUID: 'u-1', CREATED_AT: null, UPDATED_AT: null },
          { id: 2, USERNAME: 'bob', EMAIL: 'bob@test.it', PASSWORD_HASH: 'h2', ENABLED: 1, EXTERNAL_UUID: 'u-2', CREATED_AT: null, UPDATED_AT: null }
        ] }
      ]);
      const repo = new UserRepository(pool);
      const result = await repo.listAll();

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('anna');
      expect(result[1].username).toBe('bob');
    });

    it('returns empty array when no users', async () => {
      const pool = makeMockPool([
        { match: includes('ORDER BY USERNAME ASC'), rows: [] }
      ]);
      const repo = new UserRepository(pool);
      expect(await repo.listAll()).toEqual([]);
    });
  });
});
