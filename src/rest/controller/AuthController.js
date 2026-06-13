/**
 * @fileoverview Express router factory for the `/auth` resource.
 *
 * Implements OAuth2 password grant, refresh token grant, registration,
 * token revocation, and userinfo.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { RegisterRequest } from '../request/RegisterRequest.js';

/**
 * Builds the `/auth` router.
 *
 * @param {{
 *   handler: import('../../domain/port/request/AuthRequestHandler.js').AuthRequestHandler,
 *   factory: import('../factory/UserDTOFactory.js').UserDTOFactory
 * }} deps
 * @returns {Router}
 */
export function createAuthRouter({ handler, factory }) {
  const router = Router();

  // -----------------------------------------------------------------------
  // POST /auth/token — OAuth2 password grant
  // -----------------------------------------------------------------------
  router.post('/token', async (req, res, next) => {
    try {
      const { grant_type: grantType, username, password, refresh_token: refreshToken } = req.body || {};

      if (grantType === 'password') {
        const result = await handler.handlePasswordGrant(username, password);
        return res.status(200).json(result);
      }

      if (grantType === 'refresh_token') {
        const result = await handler.handleRefreshGrant(refreshToken);
        return res.status(200).json(result);
      }

      return res.status(400).json({
        error: {
          code: 'INVALID_GRANT',
          message: "Unsupported grant_type. Use 'password' or 'refresh_token'"
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------------------------------------------------
  // POST /auth/register — Create a new user
  // -----------------------------------------------------------------------
  router.post('/register', async (req, res, next) => {
    try {
      const request = new RegisterRequest(req.body);
      const data = factory.getRegisterData(request);
      const user = await handler.handleRegister(data.username, data.email, data.password);
      res.status(201).json(user.toSafeJSON());
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------------------------------------------------
  // GET /auth/userinfo — Current user info from access token
  // -----------------------------------------------------------------------
  router.get('/userinfo', authenticate, async (req, res, next) => {
    try {
      const user = /** @type {{ uuid?: string }} */ (req.user);
      if (!user.uuid) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } });
      }
      const result = await handler.handleUserinfo(user.uuid);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------------------------------------------------
  // GET /auth/users — List all users (admin only)
  // -----------------------------------------------------------------------
  router.get('/users', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
      const users = await handler.handleListUsers();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------------------------------------------------
  // PATCH /auth/users/:uuid/roles — Update user roles (admin only)
  // -----------------------------------------------------------------------
  router.patch('/users/:uuid/roles', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
      const { roles } = req.body || {};
      const result = await handler.handleUpdateRoles(req.params.uuid, roles);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------------------------------------------------
  // POST /auth/revoke — Revoke a refresh token
  // -----------------------------------------------------------------------
  router.post('/revoke', authenticate, async (req, res, next) => {
    try {
      const { refresh_token: refreshToken } = req.body || {};
      if (!refreshToken) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'refresh_token is required' }
        });
      }
      await handler.handleRevoke(refreshToken);
      res.status(200).json({ message: 'Token revoked' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
