/**
 * @fileoverview Request body for POST /auth/register.
 */

/**
 * @class RegisterRequest
 * @classdesc Registration payload (roles are assigned automatically).
 */
export class RegisterRequest {
  /**
   * @param {{ username?: string, email?: string, password?: string }} [props]
   */
  constructor({ username = null, email = null, password = null } = {}) {
    this.username = username;
    this.email = email;
    this.password = password;
  }
}
