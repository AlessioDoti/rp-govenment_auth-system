/**
 * @fileoverview Process bootstrap for auth-system.
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './persistence/db.js';
import { logger } from './config/logger.js';

const { app } = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Auth System listening');
});

/**
 * @param {string} signal
 * @returns {void}
 */
function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error closing HTTP server');
    }
    try {
      await closePool();
    } catch (poolErr) {
      logger.error({ err: poolErr }, 'Error closing MySQL pool');
    }
    process.exit(err ? 1 : 0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  shutdown('uncaughtException');
});
