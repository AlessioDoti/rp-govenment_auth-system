/**
 * @fileoverview Global Express error-handling middleware.
 *
 * Translates domain errors (AppError subclasses) into standard HTTP
 * error responses. Unknown/internal errors are masked in production.
 */

import { AppError, UnauthorizedError, ForbiddenError } from '../../../domain/error/AppError.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { translateDbError } from '../../../persistence/errors/dbErrors.js';

/**
 * @type {Record<string, number>}
 */
const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FOREIGN_KEY_VIOLATION: 409,
  INTERNAL_ERROR: 500
};

/**
 * @param {{ code?: string }} err
 * @returns {number}
 */
function statusFor(err) {
  return STATUS_BY_CODE[err.code] ?? 500;
}

/**
 * Express error-handling middleware (4-argument signature).
 *
 * @param {Error & { type?: string, status?: number, code?: string, details?: unknown }} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {void}
 */
export function globalErrorHandler(err, req, res, _next) {
  // Translate MySQL errors first
  const translated = translateDbError(err);

  if (translated instanceof AppError) {
    const statusCode = statusFor(translated);
    logger.warn(
      { err: { code: translated.code, message: translated.message, statusCode, details: translated.details } },
      translated.message
    );
    res.status(statusCode).json({
      error: {
        code: translated.code,
        message: translated.message,
        ...(translated.details ? { details: translated.details } : {})
      }
    });
    return;
  }

  // Unknown / internal
  const isProduction = env.NODE_ENV === 'production';
  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error'
    }
  });
}

/**
 * Handles Passport authentication errors by translating them into
 * the standard error response format.
 *
 * @param {Error|null} err
 * @param {{ message?: string }} [info]
 * @returns {object}
 */
export function passportErrorResponse(err, info) {
  if (err) {
    logger.error({ err }, 'Passport error');
    return { error: { code: 'INTERNAL_ERROR', message: 'Authentication error' } };
  }
  return {
    error: {
      code: 'UNAUTHORIZED',
      message: info?.message || 'Invalid or expired token'
    }
  };
}
