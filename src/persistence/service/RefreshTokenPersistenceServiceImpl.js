/**
 * @fileoverview MySQL-backed implementation of the RefreshToken persistence port.
 */

import { RefreshTokenPersistenceService } from '../../domain/port/persistence/RefreshTokenPersistenceService.js';

/**
 * @class RefreshTokenPersistenceServiceImpl
 * @classdesc Concrete adapter for refresh token persistence.
 */
export class RefreshTokenPersistenceServiceImpl extends RefreshTokenPersistenceService {
  /**
   * @param {import('../repository/RefreshTokenRepository.js').RefreshTokenRepository} refreshTokenRepository
   */
  constructor(refreshTokenRepository) {
    super();
    this.refreshTokenRepository = refreshTokenRepository;
  }

  /**
   * @param {number} userId
   * @param {string} token
   * @param {Date} expiresAt
   * @returns {Promise<void>}
   */
  async save(userId, token, expiresAt) {
    await this.refreshTokenRepository.save(userId, token, expiresAt);
  }

  /**
   * @param {string} token
   * @returns {Promise<{ id: number, userId: number, token: string, expiresAt: Date, revoked: boolean }|null>}
   */
  async findValid(token) {
    const entity = await this.refreshTokenRepository.findValid(token);
    if (!entity) return null;
    return {
      id: entity.id,
      userId: entity.userId,
      token: entity.token,
      expiresAt: entity.expiresAt,
      revoked: entity.revoked === 1 || entity.revoked === true
    };
  }

  /**
   * @param {string} token
   * @returns {Promise<void>}
   */
  async revoke(token) {
    await this.refreshTokenRepository.revoke(token);
  }
}
