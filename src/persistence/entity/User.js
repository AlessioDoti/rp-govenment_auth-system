/**
 * @fileoverview User persistence entity (USERS table row).
 */

/**
 * @class User
 * @classdesc Persistence-layer representation of a USERS row.
 */
export class User {
  /**
   * @param {{
   *   id?: number|null,
   *   username?: string|null,
   *   email?: string|null,
   *   passwordHash?: string|null,
   *   roles?: string|null,
   *   enabled?: number|null,
   *   externalUuid?: string|null,
   *   createdAt?: Date|string|null,
   *   updatedAt?: Date|string|null
   * }} [props]
   */
  constructor({
    id = null, username = null, email = null,
    passwordHash = null, roles = null, enabled = null,
    externalUuid = null, createdAt = null, updatedAt = null
  } = {}) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.roles = roles;
    this.enabled = enabled;
    this.externalUuid = externalUuid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
