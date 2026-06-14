/***
 * @fileoverview Concrete use-case for authentication operations.
 *
 * Wires the REST layer to AuthService.
 */

import { AuthRequestHandler } from '../port/request/AuthRequestHandler.js';
import { UnauthorizedError, ValidationError } from '../error/AppError.js';

/**
 * @class AuthRequestHandlerImpl
 * @classdesc Use-case implementation for auth operations.
 */
export class AuthRequestHandlerImpl extends AuthRequestHandler {
  /**
   * @param {import('../service/AuthService.js').AuthService} authService
   */
  constructor(authService) {
    super();
    this.authService = authService;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<import('../dto/TokenResponseDTO.js').TokenResponseDTO>}
   */
  async handlePasswordGrant(username, password) {
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }
    return this.authService.authenticate(username, password);
  }

  /**
   * @param {string} refreshToken
   * @returns {Promise<import('../dto/TokenResponseDTO.js').TokenResponseDTO>}
   */
  async handleRefreshGrant(refreshToken) {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    return this.authService.refresh(refreshToken);
  }

  /**
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('../dto/UserDTO.js').UserDTO>}
   */
  async handleRegister(username, email, password) {
    return this.authService.register(username, email, password);
  }

  /**
   * @param {string} uuid
   * @returns {Promise<object>}
   */
  async handleUserinfo(uuid) {
    const user = await this.authService.userPersistenceService.findByUuid(uuid);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user.toSafeJSON();
  }

  /**
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  async handleRevoke(refreshToken) {
    await this.authService.refreshTokenPersistenceService.revoke(refreshToken);
  }

  /**
   * @returns {Promise<object[]>}
   */
  async handleListUsers() {
    const users = await this.authService.userPersistenceService.listAll();
    return users.map((u) => u.toSafeJSON());
  }

  /**
   * @param {string} uuid
   * @param {string[]} roles
   * @returns {Promise<object>}
   */
  async handleUpdateRoles(uuid, roles) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new ValidationError('Roles must be a non-empty array of strings');
    }
    for (const role of roles) {
      if (typeof role !== 'string') {
        throw new ValidationError('Each role must be a string');
      }
    }

    const updated = await this.authService.userPersistenceService.updateRoles(uuid, roles);
    return updated.toSafeJSON();
  }
}
