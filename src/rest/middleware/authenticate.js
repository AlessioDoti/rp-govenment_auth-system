/**
 * @fileoverview Express middleware that verifies a Bearer JWT access token.
 *
 * On success it sets `req.user = { uuid, username, roles }`.
 * On failure it returns 401 with an error payload.
 */

import passport from 'passport';
import { logger } from '../../config/logger.js';

/**
 * Middleware that authenticates using passport-http-bearer + JWT.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export function authenticate(req, res, next) {
  passport.authenticate('bearer', { session: false }, (err, user, info) => {
    if (err) {
      logger.error({ err }, 'Authentication error');
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication error' } });
    }
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: info?.message || 'Invalid or expired token' } });
    }
    req.user = user;
    next();
  })(req, res, next);
}
