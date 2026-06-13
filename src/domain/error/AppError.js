/**
 * @fileoverview Typed error hierarchy used by the domain and adapter layers.
 */

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, details?: unknown }} [opts]
   */
  constructor(message, { code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {string[]} [details]
   */
  constructor(message, details) {
    super(message, { code: 'VALIDATION_ERROR', details });
  }
}

export class NotFoundError extends AppError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message, { code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message, { code: 'CONFLICT' });
  }
}

export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message='Unauthorized']
   */
  constructor(message = 'Unauthorized') {
    super(message, { code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  /**
   * @param {string} [message='Forbidden']
   */
  constructor(message = 'Forbidden') {
    super(message, { code: 'FORBIDDEN' });
  }
}

export class ForeignKeyViolationError extends AppError {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details) {
    super(message, { code: 'FOREIGN_KEY_VIOLATION', details });
  }
}
