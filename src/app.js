/***
 * @fileoverview Express application factory for the Auth System.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import passport from 'passport';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { buildContainer } from './config/container.js';
import { configurePassport } from './config/passport.js';
import { createAuthRouter } from './rest/controller/AuthController.js';
import { globalErrorHandler } from './rest/controller/advice/GlobalResponseEntityExceptionHandler.js';
import { ping } from './persistence/db.js';

/**
 * Builds the Express application and its container.
 *
 * @param {object} [overrides] Container overrides (mostly for tests).
 * @returns {{
 *   app: import('express').Express,
 *   container: ReturnType<typeof buildContainer>
 * }}
 */
export function createApp(overrides = {}) {
  const app = express();
  const container = overrides.container ?? buildContainer();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // Initialise Passport
  app.use(passport.initialize());
  configurePassport(container.services.tokenService);

  /**
   * Liveness + DB readiness probe.
   */
  app.get('/health', async (_req, res) => {
    try {
      await ping();
      res.status(200).json({ status: 'ok', db: 'up' });
    } catch (err) {
      res.status(503).json({ status: 'degraded', db: 'down', error: err.message });
    }
  });

  app.use('/auth', createAuthRouter({
    handler: container.handlers.authRequestHandler,
    factory: container.factories.userDTOFactory
  }));

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
  });

  app.use(globalErrorHandler);

  return { app, container };
}

export { env };
