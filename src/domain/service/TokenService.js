/**
 * @fileoverview JWT and refresh token service.
 *
 * Handles creation and verification of access tokens (JWT) and
 * opaque refresh tokens.
 */

import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

/**
 * @class TokenService
 * @classdesc Generates and verifies access and refresh tokens.
 */
export class TokenService {
  /**
   * Creates a signed JWT access token.
   *
   * @param {import('../dto/UserDTO.js').UserDTO} user
   * @returns {{ token: string, expiresIn: number }}
   */
  createAccessToken(user) {
    const payload = {
      username: user.username,
      roles: user.roles,
      userId: user.id
    };

    const expiresIn = Number(env.JWT_ACCESS_TOKEN_EXPIRES_IN) || 900;

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn,
      issuer: env.JWT_ISSUER,
      subject: user.externalUuid
    });

    return { token, expiresIn };
  }

  /**
   * Verifies a JWT access token and returns its payload.
   *
   * @param {string} token
   * @returns {{ sub: string, username: string, roles: string[], iat: number, exp: number }|null}
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: env.JWT_ISSUER,
        algorithms: ['HS256']
      });
      return /** @type {typeof decoded & { sub: string }} */ (decoded);
    } catch (err) {
      logger.warn({ err }, 'Access token verification failed');
      return null;
    }
  }

  /**
   * Generates a cryptographically random refresh token string.
   *
   * @returns {string}
   */
  createRefreshTokenString() {
    return crypto.randomBytes(48).toString('hex');
  }

  /**
   * Computes the refresh token expiry date.
   *
   * @returns {Date}
   */
  getRefreshTokenExpiry() {
    const ttl = Number(env.JWT_REFRESH_TOKEN_EXPIRES_IN) || 2592000;
    return new Date(Date.now() + ttl * 1000);
  }
}
