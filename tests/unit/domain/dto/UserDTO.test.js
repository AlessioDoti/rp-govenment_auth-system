import { UserDTO, registerSchema, tokenRequestSchema, refreshTokenRequestSchema } from '../../../../src/domain/dto/UserDTO.js';

describe('UserDTO', () => {
  describe('constructor', () => {
    it('creates with default null values', () => {
      const dto = new UserDTO();
      expect(dto.id).toBeNull();
      expect(dto.username).toBeNull();
      expect(dto.email).toBeNull();
      expect(dto.passwordHash).toBeNull();
      expect(dto.roles).toBeNull();
      expect(dto.enabled).toBeNull();
      expect(dto.externalUuid).toBeNull();
      expect(dto.createdAt).toBeNull();
      expect(dto.updatedAt).toBeNull();
    });

    it('maps all fields from props', () => {
      const now = new Date();
      const dto = new UserDTO({
        id: 1,
        username: 'mario',
        email: 'mario@test.it',
        passwordHash: '$2b$12$hash',
        roles: ['CITIZEN', 'ADMIN'],
        enabled: true,
        externalUuid: 'abc-123',
        createdAt: now,
        updatedAt: now
      });
      expect(dto.id).toBe(1);
      expect(dto.username).toBe('mario');
      expect(dto.email).toBe('mario@test.it');
      expect(dto.passwordHash).toBe('$2b$12$hash');
      expect(dto.roles).toEqual(['CITIZEN', 'ADMIN']);
      expect(dto.enabled).toBe(true);
      expect(dto.externalUuid).toBe('abc-123');
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });

    it('accepts partial props', () => {
      const dto = new UserDTO({ username: 'luigi' });
      expect(dto.username).toBe('luigi');
      expect(dto.id).toBeNull();
      expect(dto.email).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('returns safe fields without passwordHash', () => {
      const dto = new UserDTO({
        id: 1,
        username: 'test',
        email: 'test@test.it',
        passwordHash: 'secret',
        roles: ['CITIZEN'],
        enabled: true,
        externalUuid: 'uuid-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });
      const json = dto.toJSON();
      expect(json).toEqual({
        uuid: 'uuid-1',
        username: 'test',
        email: 'test@test.it',
        roles: ['CITIZEN'],
        enabled: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });
      expect(json.passwordHash).toBeUndefined();
      expect(json.id).toBeUndefined();
    });
  });

  describe('toSafeJSON', () => {
    it('returns userId, uuid, username, email, roles', () => {
      const dto = new UserDTO({
        id: 42,
        username: 'admin',
        email: 'admin@test.it',
        passwordHash: 'secret',
        roles: ['ADMIN'],
        enabled: true,
        externalUuid: 'admin-uuid'
      });
      const safe = dto.toSafeJSON();
      expect(safe).toEqual({
        userId: 42,
        uuid: 'admin-uuid',
        username: 'admin',
        email: 'admin@test.it',
        roles: ['ADMIN']
      });
      expect(safe.passwordHash).toBeUndefined();
      expect(safe.enabled).toBeUndefined();
    });

    it('works with null fields', () => {
      const dto = new UserDTO();
      const safe = dto.toSafeJSON();
      expect(safe.userId).toBeNull();
      expect(safe.uuid).toBeNull();
      expect(safe.username).toBeNull();
      expect(safe.email).toBeNull();
      expect(safe.roles).toBeNull();
    });
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      username: 'mario',
      email: 'mario@test.it',
      password: 'password123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({
      username: 'ab',
      email: 'mario@test.it',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      username: 'mario',
      email: 'not-an-email',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      username: 'mario',
      email: 'mario@test.it',
      password: 'short'
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing username', () => {
    const result = registerSchema.safeParse({
      email: 'mario@test.it',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = registerSchema.safeParse({
      username: 'mario',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = registerSchema.safeParse({
      username: 'mario',
      email: 'mario@test.it'
    });
    expect(result.success).toBe(false);
  });

  it('rejects username exceeding 100 characters', () => {
    const result = registerSchema.safeParse({
      username: 'a'.repeat(101),
      email: 'mario@test.it',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });
});

describe('tokenRequestSchema', () => {
  it('accepts valid password grant request', () => {
    const result = tokenRequestSchema.safeParse({
      grant_type: 'password',
      username: 'mario',
      password: 'secret'
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing username', () => {
    const result = tokenRequestSchema.safeParse({
      grant_type: 'password',
      password: 'secret'
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong grant_type', () => {
    const result = tokenRequestSchema.safeParse({
      grant_type: 'client_credentials',
      username: 'mario',
      password: 'secret'
    });
    expect(result.success).toBe(false);
  });
});

describe('refreshTokenRequestSchema', () => {
  it('accepts valid refresh token request', () => {
    const result = refreshTokenRequestSchema.safeParse({
      grant_type: 'refresh_token',
      refresh_token: 'some-long-token'
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing refresh_token', () => {
    const result = refreshTokenRequestSchema.safeParse({
      grant_type: 'refresh_token'
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong grant_type', () => {
    const result = refreshTokenRequestSchema.safeParse({
      grant_type: 'password',
      refresh_token: 'token'
    });
    expect(result.success).toBe(false);
  });
});
