/**
 * @fileoverview Passport.js strategy configuration.
 *
 * Configures:
 *   1. Bearer strategy — validates JWT access tokens from the
 *      `Authorization: Bearer <token>` header. Used by other
 *      microservices *and* the auth-system itself for protected
 *      endpoints (/userinfo, /revoke).
 *
 * The Bearer strategy calls TokenService.verifyAccessToken() and
 * attaches `{ uuid, username, roles }` to `req.user` on success.
 */

import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { TokenService } from '../domain/service/TokenService.js';
import { logger } from './logger.js';

/**
 * Initialises Passport with the Bearer strategy.
 *
 * Should be called once during app bootstrap (in `app.js`).
 *
 * @param {TokenService} tokenService
 */
export function configurePassport(tokenService) {
  passport.use(
    new BearerStrategy((token, done) => {
      const payload = tokenService.verifyAccessToken(token);
      if (!payload) {
        return done(null, false, { message: 'Invalid or expired token' });
      }
      return done(null, {
        uuid: payload.sub,
        username: payload.username,
        roles: payload.roles,
        userId: payload.userId
      });
    })
  );

  logger.info('Passport Bearer strategy configured');
}
