import { jest } from '@jest/globals';

const mockAuthenticate = jest.fn();

jest.unstable_mockModule('passport', () => ({
  default: {
    authenticate: mockAuthenticate
  }
}));

const { authenticate } = await import('../../../../src/rest/middleware/authenticate.js');

describe('authenticate middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('calls next() when authentication succeeds', () => {
    mockAuthenticate.mockImplementation((_strategy, _options, callback) => {
      return (_req, _res, _next) => {
        callback(null, { uuid: 'u-1', username: 'mario', roles: ['CITIZEN'] }, null);
        _next();
      };
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets req.user when authentication succeeds', () => {
    mockAuthenticate.mockImplementation((_strategy, _options, callback) => {
      return (_req, _res, _next) => {
        callback(null, { uuid: 'u-1', username: 'mario', roles: ['CITIZEN'] }, null);
        _next();
      };
    });

    authenticate(req, res, next);

    expect(req.user).toEqual({ uuid: 'u-1', username: 'mario', roles: ['CITIZEN'] });
  });

  it('returns 401 when authentication fails', () => {
    mockAuthenticate.mockImplementation((_strategy, _options, callback) => {
      return (_req, _res, _next) => {
        callback(null, false, { message: 'Invalid or expired token' });
      };
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with default message when info is absent', () => {
    mockAuthenticate.mockImplementation((_strategy, _options, callback) => {
      return (_req, _res, _next) => {
        callback(null, false, null);
      };
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  });

  it('returns 500 when authentication errors', () => {
    const authErr = new Error('Passport internal error');
    mockAuthenticate.mockImplementation((_strategy, _options, callback) => {
      return (_req, _res, _next) => {
        callback(authErr, false, null);
      };
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Authentication error' }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
