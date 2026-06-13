/**
 * @fileoverview Persistence port for refresh tokens.
 */

/**
 * @class RefreshTokenPersistenceService
 * @classdesc Port for storing and retrieving OAuth2 refresh tokens.
 */
export class RefreshTokenPersistenceService {
  /**
   * Stores a new refresh token.
   *
   * @param {number} userId Internal user id.
   * @param {string} token The refresh token string.
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(userId, token, expiresAt) {
    throw new Error('Not implemented');
  }

  /**
   * Finds a non-revoked, non-expired refresh token.
   *
   * @param {string} token
   * @returns {Promise<{ id: number, userId: number, token: string, expiresAt: Date, revoked: boolean }|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findValid(token) {
    throw new Error('Not implemented');
  }

  /**
   * Revokes a refresh token.
   *
   * @param {string} token
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async revoke(token) {
    throw new Error('Not implemented');
  }
}
