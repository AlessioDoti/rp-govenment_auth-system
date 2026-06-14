import { translateDbError } from '../../../../src/persistence/errors/dbErrors.js';
import { ConflictError, ForeignKeyViolationError } from '../../../../src/domain/error/AppError.js';

describe('translateDbError', () => {
  describe('ER_DUP_ENTRY (errno 1062)', () => {
    it('returns ConflictError with constraint name', () => {
      const mysqlErr = new Error('Duplicate entry');
      mysqlErr.code = 'ER_DUP_ENTRY';
      mysqlErr.errno = 1062;
      mysqlErr.sqlState = '23000';
      mysqlErr.sqlMessage = "Duplicate entry 'mario' for key 'UK_USERNAME'";

      const result = translateDbError(mysqlErr);

      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toContain('mario');
      expect(result.message).toContain('UK_USERNAME');
      expect(result.code).toBe('CONFLICT');
    });

    it('returns ConflictError when sqlMessage format differs', () => {
      const mysqlErr = new Error('Duplicate entry');
      mysqlErr.code = 'ER_DUP_ENTRY';
      mysqlErr.errno = 1062;
      mysqlErr.sqlMessage = "Duplicate entry 'abc' for key 'PRIMARY'";

      const result = translateDbError(mysqlErr);

      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toContain('PRIMARY');
    });

    it('returns ConflictError with fallback "unknown" when parsing fails', () => {
      const mysqlErr = new Error('Duplicate entry');
      mysqlErr.code = 'ER_DUP_ENTRY';
      mysqlErr.errno = 1062;
      mysqlErr.sqlMessage = null;

      const result = translateDbError(mysqlErr);
      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toContain('unknown');
    });
  });

  describe('ER_ROW_IS_REFERENCED_2 (errno 1451)', () => {
    it('returns ForeignKeyViolationError', () => {
      const mysqlErr = new Error('Cannot delete or update a parent row');
      mysqlErr.code = 'ER_ROW_IS_REFERENCED_2';
      mysqlErr.errno = 1451;
      mysqlErr.sqlMessage =
        'Cannot delete or update a parent row: a foreign key constraint fails';

      const result = translateDbError(mysqlErr);

      expect(result).toBeInstanceOf(ForeignKeyViolationError);
      expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(result.message).toContain('row is still referenced');
    });
  });

  describe('ER_NO_REFERENCED_ROW_2 (errno 1452)', () => {
    it('returns ForeignKeyViolationError', () => {
      const mysqlErr = new Error('Cannot add or update a child row');
      mysqlErr.code = 'ER_NO_REFERENCED_ROW_2';
      mysqlErr.errno = 1452;
      mysqlErr.sqlMessage =
        'Cannot add or update a child row: a foreign key constraint fails';

      const result = translateDbError(mysqlErr);

      expect(result).toBeInstanceOf(ForeignKeyViolationError);
      expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(result.message).toContain('referenced row does not exist');
    });
  });

  describe('unknown errors', () => {
    it('returns the original error when code is unrelated', () => {
      const err = new Error('Some other error');
      err.code = 'ER_PARSE_ERROR';
      err.errno = 1064;

      const result = translateDbError(err);
      expect(result).toBe(err);
    });

    it('returns the original error when errno is unrecognised', () => {
      const err = new Error('Custom error');
      err.errno = 99999;

      const result = translateDbError(err);
      expect(result).toBe(err);
    });

    it('returns the original error when it is a plain Error without code', () => {
      const err = new Error('Plain error');
      const result = translateDbError(err);
      expect(result).toBe(err);
    });

    it('handles null/undefined gracefully', () => {
      expect(translateDbError(null)).toBeNull();
      expect(translateDbError(undefined)).toBeUndefined();
    });
  });
});
