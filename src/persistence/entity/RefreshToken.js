/**
 * @fileoverview RefreshToken persistence entity (REFRESH_TOKENS table row).
 */

/**
 * @class RefreshToken
 * @classdesc Persistence-layer representation of a REFRESH_TOKENS row.
 */
export class RefreshToken {
  /**
   * @param {{
   *   id?: number|null,
   *   userId?: number|null,
   *   token?: string|null,
   *   expiresAt?: Date|string|null,
   *   revoked?: number|null,
   *   createdAt?: Date|string|null
   * }} [props]
   */
  constructor({
    id = null, userId = null, token = null,
    expiresAt = null, revoked = null, createdAt = null
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.revoked = revoked;
    this.createdAt = createdAt;
  }
}
