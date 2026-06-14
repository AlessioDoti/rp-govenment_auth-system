/***
 * @fileoverview Use-case port for authentication operations.
 */

/***
 * @class AuthRequestHandler
 * @classdesc Use-case port. The REST adapter calls into this.
 */
export class AuthRequestHandler {
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<import('../../dto/TokenResponseDTO.js').TokenResponseDTO>}
   */
  // eslint-disable-next-line no-unused-vars
  async handlePasswordGrant(username, password) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} refreshToken
   * @returns {Promise<import('../../dto/TokenResponseDTO.js').TokenResponseDTO>}
   */
  // eslint-disable-next-line no-unused-vars
  async handleRefreshGrant(refreshToken) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO>}
   */
  // eslint-disable-next-line no-unused-vars
  async handleRegister(username, email, password) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} uuid
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async handleUserinfo(uuid) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async handleRevoke(refreshToken) {
    throw new Error('Not implemented');
  }

  /**
   * Lists all users. Only safe fields (no password hashes).
   * @returns {Promise<object[]>}
   */
  async handleListUsers() {
    throw new Error('Not implemented');
  }

  /**
   * Replaces the roles of a user.
   * @param {string} uuid
   * @param {string[]} roles
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async handleUpdateRoles(uuid, roles) {
    throw new Error('Not implemented');
  }
}
