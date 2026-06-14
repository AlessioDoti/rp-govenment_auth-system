/***
 * @fileoverview SQL repository for the REFRESH_TOKENS table.
 */

import { RefreshToken } from '../entity/RefreshToken.js';

/**
 * @class RefreshTokenRepository
 * @classdesc Data-access layer for REFRESH_TOKENS.
 */
export class RefreshTokenRepository {
  /**
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Inserts a refresh token.
   *
   * @param {number} userId
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<RefreshToken>}
   */
  async save(userId, token, expiresAt) {
    const [result] = await this.pool.query(
      'INSERT INTO REFRESH_TOKENS (USER_ID, TOKEN, EXPIRES_AT) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    const [rows] = await this.pool.query(
      'SELECT id, USER_ID, TOKEN, EXPIRES_AT, REVOKED, CREATED_AT FROM REFRESH_TOKENS WHERE id = ?',
      [result.insertId]
    );
    return this._rowToEntity(rows[0]);
  }

  /**
   * Finds a non-revoked, non-expired refresh token.
   *
   * @param {string} token
   * @returns {Promise<RefreshToken|null>}
   */
  async findValid(token) {
    const [rows] = await this.pool.query(
      'SELECT id, USER_ID, TOKEN, EXPIRES_AT, REVOKED, CREATED_AT FROM REFRESH_TOKENS WHERE TOKEN = ? AND REVOKED = 0 AND EXPIRES_AT > NOW()',
      [token]
    );
    if (rows.length === 0) return null;
    return this._rowToEntity(rows[0]);
  }

  /**
   * Revokes a refresh token.
   *
   * @param {string} token
   * @returns {Promise<void>}
   */
  async revoke(token) {
    await this.pool.query(
      'UPDATE REFRESH_TOKENS SET REVOKED = 1 WHERE TOKEN = ?',
      [token]
    );
  }

  /**
   * @param {object} r
   * @returns {RefreshToken}
   * @private
   */
  _rowToEntity(r) {
    return new RefreshToken({
      id: r.id,
      userId: r.USER_ID,
      token: r.TOKEN,
      expiresAt: r.EXPIRES_AT,
      revoked: r.REVOKED,
      createdAt: r.CREATED_AT
    });
  }
}
