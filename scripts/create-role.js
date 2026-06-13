#!/usr/bin/env node

/**
 * @fileoverview CLI script to create a new role in the ROLES catalogue.
 *
 * Usage:
 *   node --env-file=.env scripts/create-role.js OPERATOR "Can manage operations"
 *
 * The script:
 *   1. Connects to the auth database using env vars.
 *   2. Checks the role doesn't already exist.
 *   3. Inserts the new row.
 *
 * Exit codes:
 *   0 — success
 *   1 — validation failure or DB error
 */

import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const [name, description] = process.argv.slice(2);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
if (!name) {
  console.error('Usage: node scripts/create-role.js NAME [description]');
  console.error('');
  console.error('Examples:');
  console.error('  node --env-file=.env scripts/create-role.js OPERATOR');
  console.error('  node --env-file=.env scripts/create-role.js MANAGER "Can manage tax categories"');
  process.exit(1);
}

if (name.length > 50) {
  console.error('Role name must be at most 50 characters');
  process.exit(1);
}

if (!/^[A-Z_]+$/.test(name)) {
  console.error('Role name must contain only uppercase letters and underscores (e.g. OPERATOR, TAX_MANAGER)');
  process.exit(1);
}

if (description && description.length > 255) {
  console.error('Description must be at most 255 characters');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// DB operation
// ---------------------------------------------------------------------------
let pool;
try {
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  // Check uniqueness
  const [rows] = await pool.query('SELECT id FROM ROLES WHERE NAME = ?', [name]);
  if (rows.length > 0) {
    console.error(`Role '${name}' already exists (id=${rows[0].id})`);
    process.exit(1);
  }

  // Insert
  await pool.query(
    'INSERT INTO ROLES (NAME, DESCRIPTION) VALUES (?, ?)',
    [name, description || null]
  );

  console.log(`Role '${name}' created successfully.`);

  // Show all roles
  const [allRoles] = await pool.query('SELECT id, NAME, DESCRIPTION FROM ROLES ORDER BY NAME');
  console.log('\nAvailable roles:');
  console.table(allRoles);

  await pool.end();
  process.exit(0);
} catch (err) {
  console.error('Error creating role:', err.message);
  if (pool) await pool.end().catch(() => {});
  process.exit(1);
}
