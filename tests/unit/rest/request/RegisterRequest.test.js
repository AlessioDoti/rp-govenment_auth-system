import { RegisterRequest } from '../../../../src/rest/request/RegisterRequest.js';

describe('RegisterRequest', () => {
  it('creates with default null values', () => {
    const req = new RegisterRequest();
    expect(req.username).toBeNull();
    expect(req.email).toBeNull();
    expect(req.password).toBeNull();
  });

  it('maps all fields from props', () => {
    const req = new RegisterRequest({
      username: 'mario',
      email: 'mario@test.it',
      password: 'securePassword123'
    });
    expect(req.username).toBe('mario');
    expect(req.email).toBe('mario@test.it');
    expect(req.password).toBe('securePassword123');
  });

  it('accepts partial props', () => {
    const req = new RegisterRequest({ username: 'luigi' });
    expect(req.username).toBe('luigi');
    expect(req.email).toBeNull();
    expect(req.password).toBeNull();
  });

  it('accepts empty string values', () => {
    const req = new RegisterRequest({ username: '', email: '', password: '' });
    expect(req.username).toBe('');
    expect(req.email).toBe('');
    expect(req.password).toBe('');
  });

  it('uses defaults when called without arguments', () => {
    const req = new RegisterRequest();
    expect(req.username).toBeNull();
    expect(req.email).toBeNull();
    expect(req.password).toBeNull();
  });
});
