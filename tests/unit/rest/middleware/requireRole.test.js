import { jest } from '@jest/globals';
import { requireRole } from '../../../../src/rest/middleware/requireRole.js';

describe('requireRole middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { path: '/test', user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('calls next() when user has the required role', () => {
    req.user = { uuid: 'u-1', username: 'admin', roles: ['ADMIN'] };
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user has one of the required roles', () => {
    req.user = { uuid: 'u-1', username: 'manager', roles: ['MANAGER'] };
    const middleware = requireRole('ADMIN', 'MANAGER');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user does not have required role', () => {
    req.user = { uuid: 'u-1', username: 'citizen', roles: ['CITIZEN'] };
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when user is not set (authenticate not called)', () => {
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when user has undefined roles', () => {
    req.user = { uuid: 'u-1', username: 'test' };
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
    });
  });

  it('returns 401 when user has empty roles array', () => {
    req.user = { uuid: 'u-1', username: 'test', roles: [] };
    const middleware = requireRole('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
