/**
 * @fileoverview Translates known MySQL driver errors into typed
 * `AppError` subclasses. Mirrors the same utility in sibling
 * microservices.
 */

import { ConflictError, ForeignKeyViolationError } from '../../domain/error/AppError.js';

/**
 * @param {Error & { code?: string, errno?: number, sqlMessage?: string }} err
 * @returns {Error}
 */
export function translateDbError(err) {
  if (!err) return err;

  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    const match = err.sqlMessage?.match(/Duplicate entry '(.+?)' for key '(.+?)'/);
    const value = match ? match[1] : 'unknown';
    const key = match ? match[2] : 'unknown';
    return new ConflictError(
      `Duplicate value '${value}' violates unique constraint '${key}'`
    );
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    return new ForeignKeyViolationError(
      'Cannot delete or update: row is still referenced by other rows'
    );
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return new ForeignKeyViolationError(
      'Cannot add or update: referenced row does not exist'
    );
  }

  return err;
}
