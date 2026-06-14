/***
 * @fileoverview Lazily-validated environment configuration.
 *
 * Uses the same lazy Proxy pattern as sibling microservices so that
 * import from a test runner works without hard failure.
 */

import { z } from 'zod';

/**
 * @typedef {Object} Env
 * @property {'development'|'test'|'production'} NODE_ENV
 * @property {number} PORT
 * @property {string} DB_HOST
 * @property {number} DB_PORT
 * @property {string} DB_USER
 * @property {string} DB_PASSWORD
 * @property {string} DB_NAME
 * @property {number} DB_CONNECTION_LIMIT
 * @property {'fatal'|'error'|'warn'|'info'|'debug'|'trace'} LOG_LEVEL
 * @property {string} JWT_SECRET
 * @property {string} JWT_ISSUER
 * @property {number} JWT_ACCESS_TOKEN_EXPIRES_IN
 * @property {number} JWT_REFRESH_TOKEN_EXPIRES_IN
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8083),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ISSUER: z.string().default('rp-auth-system'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().int().positive().default(2592000)
});

/** @type {Env|null} */
let cached = null;

function load() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = 'Invalid environment configuration: ' + JSON.stringify(parsed.error.format());
    throw new Error(message);
  }
  cached = parsed.data;
  return cached;
}

/***
 * Lazy, throw-on-first-use accessor for the validated env.
 */
export const env = new Proxy({}, {
  get(_t, prop) { return load()[prop]; }
});
