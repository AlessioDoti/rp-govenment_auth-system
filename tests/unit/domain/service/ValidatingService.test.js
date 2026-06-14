import { z } from 'zod';
import { ValidatingService } from '../../../../src/domain/service/ValidatingService.js';
import { ValidationError } from '../../../../src/domain/error/AppError.js';

describe('ValidatingService', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().int().positive()
  });

  it('does not throw when the DTO satisfies the schema', () => {
    const service = new ValidatingService(schema);
    expect(() => service.validate({ name: 'ok', age: 25 })).not.toThrow();
  });

  it('throws ValidationError when the DTO fails the schema', () => {
    const service = new ValidatingService(schema);
    try {
      service.validate({ name: '', age: -1 });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(err.details)).toBe(true);
      expect(err.details.length).toBeGreaterThan(0);
      return;
    }
    throw new Error('Expected validate to throw');
  });

  it('throws if instantiated without a schema', () => {
    expect(() => new ValidatingService()).toThrow(/requires a Zod schema/);
    expect(() => new ValidatingService(null)).toThrow(/requires a Zod schema/);
  });

  it('formatZodError produces correct format', () => {
    const result = schema.safeParse({ name: '', age: 0 });
    expect(result.success).toBe(false);
    const formatted = ValidatingService.formatZodError(result.error);
    expect(formatted).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/name: /),
        expect.stringMatching(/age: /)
      ])
    );
  });
});
