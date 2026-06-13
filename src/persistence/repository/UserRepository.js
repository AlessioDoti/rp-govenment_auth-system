/**
 * @fileoverview SQL repository for the USERS table.
 *
 * Handles CRUD for the USERS row only. Roles are managed through
 * the RoleRepository (which handles the ROLES + USERS_ROLES tables).
 */

import { User } from '../entity/User.js';

/**
 * @class UserRepository
 * @classdesc Data-access layer for USERS.
 */
export class UserRepository {
  /**
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Columns returned by every user query (excluding roles).
   * @type {string}
   */
  static COLUMNS = 'id, USERNAME, EMAIL, PASSWORD_HASH, ENABLED, EXTERNAL_UUID, CREATED_AT, UPDATED_AT';

  /**
   * @param {number|string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    const [rows] = await this.pool.query(
      `SELECT ${UserRepository.COLUMNS} FROM USERS WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return this._rowToEntity(rows[0]);
  }

  /**
   * @param {string} username
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    const [rows] = await this.pool.query(
      `SELECT ${UserRepository.COLUMNS} FROM USERS WHERE USERNAME = ?`,
      [username]
    );
    if (rows.length === 0) return null;
    return this._rowToEntity(rows[0]);
  }

  /**
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    const [rows] = await this.pool.query(
      `SELECT ${UserRepository.COLUMNS} FROM USERS WHERE EMAIL = ?`,
      [email]
    );
    if (rows.length === 0) return null;
    return this._rowToEntity(rows[0]);
  }

  /**
   * @param {string} uuid
   * @returns {Promise<User|null>}
   */
  async findByExternalUuid(uuid) {
    const [rows] = await this.pool.query(
      `SELECT ${UserRepository.COLUMNS} FROM USERS WHERE EXTERNAL_UUID = ?`,
      [uuid]
    );
    if (rows.length === 0) return null;
    return this._rowToEntity(rows[0]);
  }

  /**
   * Inserts or updates a user row (roles are managed separately).
   *
   * @param {User} user
   * @returns {Promise<User>}
   */
  async save(user) {
    if (user.id) {
      await this.pool.query(
        `UPDATE USERS SET
           USERNAME = ?,
           EMAIL = ?,
           PASSWORD_HASH = ?,
           ENABLED = ?,
           EXTERNAL_UUID = ?
         WHERE id = ?`,
        [
          user.username,
          user.email,
          user.passwordHash,
          user.enabled,
          user.externalUuid,
          user.id
        ]
      );
      return this.findById(user.id);
    }

    const [result] = await this.pool.query(
      `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, ENABLED, EXTERNAL_UUID)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.username,
        user.email,
        user.passwordHash,
        user.enabled,
        user.externalUuid
      ]
    );
    return this.findById(result.insertId);
  }

  /**
   * Lists every user (ordered by username).
   * @returns {Promise<User[]>}
   */
  async listAll() {
    const [rows] = await this.pool.query(
      `SELECT ${UserRepository.COLUMNS} FROM USERS ORDER BY USERNAME ASC`
    );
    return rows.map((r) => this._rowToEntity(r));
  }

  /**
   * @param {object} r Row from USERS table.
   * @returns {User}
   * @private
   */
  _rowToEntity(r) {
    return new User({
      id: r.id,
      username: r.USERNAME,
      email: r.EMAIL,
      passwordHash: r.PASSWORD_HASH,
      roles: [],     // populated by UserPersistenceServiceImpl via RoleRepository
      enabled: r.ENABLED,
      externalUuid: r.EXTERNAL_UUID,
      createdAt: r.CREATED_AT,
      updatedAt: r.UPDATED_AT
    });
  }
}
