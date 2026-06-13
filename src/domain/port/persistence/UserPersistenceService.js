/**
 * @fileoverview Persistence port for the User aggregate.
 */

/**
 * @class UserPersistenceService
 * @classdesc Port the domain uses to persist and retrieve users.
 */
export class UserPersistenceService {
  /**
   * @param {import('../../dto/UserDTO.js').UserDTO} dto
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO>}
   */
  async saveUser(dto) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} username
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO|null>}
   */
  async findByUsername(username) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO|null>}
   */
  async findByEmail(email) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} uuid
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO|null>}
   */
  async findByUuid(uuid) {
    throw new Error('Not implemented');
  }

  /**
   * @param {number} internalId
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO|null>}
   */
  async findByInternalId(internalId) {
    throw new Error('Not implemented');
  }

  /**
   * Lists all users (safe projection — no password hashes).
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO[]>}
   */
  async listAll() {
    throw new Error('Not implemented');
  }

  /**
   * Replaces the roles of a user identified by external UUID.
   * @param {string} uuid
   * @param {string[]} roles
   * @returns {Promise<import('../../dto/UserDTO.js').UserDTO>}
   */
  // eslint-disable-next-line no-unused-vars
  async updateRoles(uuid, roles) {
    throw new Error('Not implemented');
  }
}
