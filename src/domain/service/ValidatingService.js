/**
 * @fileoverview Base class for domain services that validate a DTO
 * with a Zod schema before touching the persistence port.
 */

import { ValidationError } from '../error/AppError.js';
import { logger } from '../../config/logger.js';

export class ValidatingService {
  /**
   * @param {import('zod').ZodTypeAny} schema
   */
  constructor(schema) {
    if (!schema) {
      throw new Error('ValidatingService requires a Zod schema');
    }
    this.schema = schema;
  }

  /**
   * @param {object} dto
   * @returns {void}
   * @throws {ValidationError}
   */
  validate(dto) {
    logger.debug({ dto }, 'Validating DTO');
    const result = this.schema.safeParse(dto);
    if (!result.success) {
      throw new ValidationError('Validation failed', ValidatingService.formatZodError(result.error));
    }
  }

  /**
   * @param {import('zod').ZodError} zodError
   * @returns {string[]}
   */
  static formatZodError(zodError) {
    return zodError.issues.map(
      (issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`
    );
  }
}
