/**
 * @fileoverview SQL repository for the ROLES catalogue.
 *
 * All read-only operations use the pool directly; write operations
 * that are part of a user aggregate transaction receive a connection
 * from the caller.
 */

/**
 * @class RoleRepository
 * @classdesc Data-access layer for ROLES table.
 */
export class RoleRepository {
  /**
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Finds a role by its name.
   *
   * @param {string} name
   * @returns {Promise<{ id: number, name: string, description: string|null }|null>}
   */
  async findByName(name) {
    const [rows] = await this.pool.query(
      'SELECT id, NAME, DESCRIPTION FROM ROLES WHERE NAME = ?',
      [name]
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, name: rows[0].NAME, description: rows[0].DESCRIPTION };
  }

  /**
   * Lists every available role (ordered by name).
   *
   * @returns {Promise<Array<{ id: number, name: string, description: string|null }>>}
   */
  async findAll() {
    const [rows] = await this.pool.query(
      'SELECT id, NAME, DESCRIPTION FROM ROLES ORDER BY NAME ASC'
    );
    return rows.map((r) => ({ id: r.id, name: r.NAME, description: r.DESCRIPTION }));
  }

  /**
   * Returns the role names assigned to a user (by internal user id).
   *
   * @param {number} userId
   * @returns {Promise<string[]>}
   */
  async findNamesByUserId(userId) {
    const [rows] = await this.pool.query(
      `SELECT r.NAME
       FROM USERS_ROLES ur
       JOIN ROLES r ON r.id = ur.ROLE_ID
       WHERE ur.USER_ID = ?
       ORDER BY r.NAME`,
      [userId]
    );
    return rows.map((r) => r.NAME);
  }

  /**
   * Assigns a set of role names to a user inside an existing transaction.
   * All previous roles for that user are removed first.
   *
   * @param {import('mysql2/promise').Connection} conn  Active transaction connection.
   * @param {number} userId  Internal user id.
   * @param {string[]} roleNames  Role names to assign (must exist in ROLES).
   * @returns {Promise<void>}
   */
  async assignRoles(conn, userId, roleNames) {
    // Remove existing roles
    await conn.query('DELETE FROM USERS_ROLES WHERE USER_ID = ?', [userId]);

    if (roleNames.length === 0) return;

    // Insert each role (silently skip names that don't exist in ROLES)
    for (const roleName of roleNames) {
      await conn.query(
        'INSERT IGNORE INTO USERS_ROLES (USER_ID, ROLE_ID) SELECT ?, id FROM ROLES WHERE NAME = ?',
        [userId, roleName]
      );
    }
  }
}
