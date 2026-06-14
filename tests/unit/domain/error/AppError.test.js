import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ForeignKeyViolationError
} from '../../../../src/domain/error/AppError.js';

describe('AppError hierarchy', () => {
  describe('AppError', () => {
    it('creates with default INTERNAL_ERROR code', () => {
      const err = new AppError('Something went wrong');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
      expect(err.name).toBe('AppError');
      expect(err.message).toBe('Something went wrong');
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.details).toBeUndefined();
    });

    it('accepts custom code and details', () => {
      const err = new AppError('Custom', { code: 'CUSTOM_CODE', details: { foo: 'bar' } });
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.details).toEqual({ foo: 'bar' });
    });

    it('accepts code but no details', () => {
      const err = new AppError('No details', { code: 'NO_DETAILS' });
      expect(err.code).toBe('NO_DETAILS');
      expect(err.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('sets VALIDATION_ERROR code and stores details array', () => {
      const details = ['username: required', 'email: invalid'];
      const err = new ValidationError('Validation failed', details);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.name).toBe('ValidationError');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual(details);
    });

    it('works without details', () => {
      const err = new ValidationError('Validation failed');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toBeUndefined();
    });
  });

  describe('NotFoundError', () => {
    it('sets NOT_FOUND code', () => {
      const err = new NotFoundError('User not found');
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.name).toBe('NotFoundError');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('sets CONFLICT code', () => {
      const err = new ConflictError('Duplicate entry');
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(ConflictError);
      expect(err.name).toBe('ConflictError');
      expect(err.code).toBe('CONFLICT');
      expect(err.message).toBe('Duplicate entry');
    });
  });

  describe('UnauthorizedError', () => {
    it('sets UNAUTHORIZED code with default message', () => {
      const err = new UnauthorizedError();
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.name).toBe('UnauthorizedError');
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Unauthorized');
    });

    it('accepts custom message', () => {
      const err = new UnauthorizedError('Invalid token');
      expect(err.message).toBe('Invalid token');
      expect(err.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('sets FORBIDDEN code with default message', () => {
      const err = new ForbiddenError();
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.name).toBe('ForbiddenError');
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('Forbidden');
    });

    it('accepts custom message', () => {
      const err = new ForbiddenError('Access denied');
      expect(err.message).toBe('Access denied');
    });
  });

  describe('ForeignKeyViolationError', () => {
    it('sets FOREIGN_KEY_VIOLATION code and details', () => {
      const details = { constraint: 'FK_USER_ROLE' };
      const err = new ForeignKeyViolationError('Referenced row not found', details);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(ForeignKeyViolationError);
      expect(err.name).toBe('ForeignKeyViolationError');
      expect(err.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(err.details).toEqual(details);
    });

    it('works without details', () => {
      const err = new ForeignKeyViolationError('constraint violation');
      expect(err.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(err.details).toBeUndefined();
    });
  });

  it('NotFoundError is not instanceof ValidationError', () => {
    const err = new NotFoundError('test');
    expect(err).not.toBeInstanceOf(ValidationError);
  });

  it('UnauthorizedError is not instanceof ForbiddenError', () => {
    expect(new UnauthorizedError()).not.toBeInstanceOf(ForbiddenError);
  });

  it('All custom errors are instanceof Error', () => {
    expect(new ValidationError('')).toBeInstanceOf(Error);
    expect(new NotFoundError('')).toBeInstanceOf(Error);
    expect(new ConflictError('')).toBeInstanceOf(Error);
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
    expect(new ForbiddenError()).toBeInstanceOf(Error);
    expect(new ForeignKeyViolationError('')).toBeInstanceOf(Error);
  });
});
