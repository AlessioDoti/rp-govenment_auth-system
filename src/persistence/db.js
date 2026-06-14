/***
 * @fileoverview MySQL connection pool (singleton) and lifecycle helpers.
 */

import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/** @type {import('mysql2/promise').Pool|null} */
let pool = null;

/**
 * Returns the process-wide MySQL connection pool, creating it on the
 * first call.
 *
 * @returns {import('mysql2/promise').Pool}
 */
export function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: false
  });

  logger.info({ host: env.DB_HOST, db: env.DB_NAME }, 'MySQL pool created');
  return pool;
}

/**
 * Closes the pool, releasing every connection.
 *
 * @returns {Promise<void>}
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('MySQL pool closed');
  }
}

/**
 * Pings the database by acquiring a connection and running `SELECT 1`.
 *
 * @returns {Promise<true>}
 * @throws {Error}
 */
export async function ping() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}
