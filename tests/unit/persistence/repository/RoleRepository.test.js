import { jest } from '@jest/globals';
import { RoleRepository } from '../../../../src/persistence/repository/RoleRepository.js';

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

describe('RoleRepository', () => {
  describe('findAll', () => {
    it('returns all roles ordered by name', async () => {
      const pool = makeMockPool([
        { match: includes('FROM ROLES ORDER BY NAME ASC'), rows: [
          { id: 1, NAME: 'ADMIN', DESCRIPTION: 'Administrator' },
          { id: 2, NAME: 'CITIZEN', DESCRIPTION: 'Citizen' }
        ] }
      ]);
      const repo = new RoleRepository(pool);
      const result = await repo.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: 'ADMIN', description: 'Administrator' });
      expect(result[1]).toEqual({ id: 2, name: 'CITIZEN', description: 'Citizen' });
    });

    it('returns empty array when no roles', async () => {
      const pool = makeMockPool([
        { match: includes('FROM ROLES ORDER BY NAME ASC'), rows: [] }
      ]);
      const repo = new RoleRepository(pool);
      expect(await repo.findAll()).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('returns the role when found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM ROLES WHERE NAME = ?'), rows: [
          { id: 1, NAME: 'ADMIN', DESCRIPTION: 'Administrator' }
        ] }
      ]);
      const repo = new RoleRepository(pool);
      const result = await repo.findByName('ADMIN');

      expect(result).toEqual({ id: 1, name: 'ADMIN', description: 'Administrator' });
    });

    it('returns null when not found', async () => {
      const pool = makeMockPool([
        { match: includes('FROM ROLES WHERE NAME = ?'), rows: [] }
      ]);
      const repo = new RoleRepository(pool);
      expect(await repo.findByName('NONEXISTENT')).toBeNull();
    });
  });

  describe('findNamesByUserId', () => {
    it('returns role names for a user', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS_ROLES ur'), rows: [
          { NAME: 'CITIZEN' },
          { NAME: 'ADMIN' }
        ] }
      ]);
      const repo = new RoleRepository(pool);
      const result = await repo.findNamesByUserId(1);

      expect(result).toEqual(['CITIZEN', 'ADMIN']);
    });

    it('returns empty array when user has no roles', async () => {
      const pool = makeMockPool([
        { match: includes('FROM USERS_ROLES ur'), rows: [] }
      ]);
      const repo = new RoleRepository(pool);
      expect(await repo.findNamesByUserId(999)).toEqual([]);
    });
  });

  describe('assignRoles', () => {
    it('deletes existing roles and inserts new ones', async () => {
      const conn = {
        query: jest.fn()
      };
      conn.query.mockResolvedValue([{}, []]);

      const pool = { query: jest.fn() };
      const repo = new RoleRepository(pool);
      await repo.assignRoles(conn, 1, ['ADMIN', 'MANAGER']);

      expect(conn.query).toHaveBeenCalledTimes(3);
      expect(conn.query.mock.calls[0][0]).toContain('DELETE FROM USERS_ROLES');
      expect(conn.query.mock.calls[1][0]).toContain('INSERT IGNORE');
      expect(conn.query.mock.calls[2][0]).toContain('INSERT IGNORE');
    });

    it('only deletes when roleNames is empty', async () => {
      const conn = {
        query: jest.fn().mockResolvedValue([{}, []])
      };
      const pool = { query: jest.fn() };
      const repo = new RoleRepository(pool);
      await repo.assignRoles(conn, 1, []);

      expect(conn.query).toHaveBeenCalledTimes(1);
      expect(conn.query.mock.calls[0][0]).toContain('DELETE FROM USERS_ROLES');
    });
  });
});
