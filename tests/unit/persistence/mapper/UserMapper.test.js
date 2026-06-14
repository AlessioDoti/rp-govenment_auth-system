import { UserMapper } from '../../../../src/persistence/mapper/UserMapper.js';
import { User } from '../../../../src/persistence/entity/User.js';
import { UserDTO } from '../../../../src/domain/dto/UserDTO.js';

describe('UserMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  describe('toDTO', () => {
    it('maps a full entity to DTO', () => {
      const entity = new User({
        id: 42,
        username: 'mario',
        email: 'mario@test.it',
        passwordHash: '$2b$12$hash',
        roles: ['CITIZEN'],
        enabled: 1,
        externalUuid: 'uuid-abc',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });

      const dto = mapper.toDTO(entity);

      expect(dto).toBeInstanceOf(UserDTO);
      expect(dto.id).toBe(42);
      expect(dto.username).toBe('mario');
      expect(dto.email).toBe('mario@test.it');
      expect(dto.passwordHash).toBe('$2b$12$hash');
      expect(dto.roles).toEqual(['CITIZEN']);
      expect(dto.enabled).toBe(true);
      expect(dto.externalUuid).toBe('uuid-abc');
      expect(dto.createdAt).toBe('2024-01-01');
      expect(dto.updatedAt).toBe('2024-01-02');
    });

    it('converts enabled=1 to true', () => {
      const entity = new User({ enabled: 1 });
      const dto = mapper.toDTO(entity);
      expect(dto.enabled).toBe(true);
    });

    it('converts enabled=true to true', () => {
      const entity = new User({ enabled: true });
      const dto = mapper.toDTO(entity);
      expect(dto.enabled).toBe(true);
    });

    it('converts enabled=0 to false', () => {
      const entity = new User({ enabled: 0 });
      const dto = mapper.toDTO(entity);
      expect(dto.enabled).toBe(false);
    });

    it('converts null roles to empty array', () => {
      const entity = new User({ roles: null });
      const dto = mapper.toDTO(entity);
      expect(dto.roles).toEqual([]);
    });

    it('converts undefined roles to empty array', () => {
      const entity = new User({});
      const dto = mapper.toDTO(entity);
      expect(dto.roles).toEqual([]);
    });

    it('returns null for null input', () => {
      expect(mapper.toDTO(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(mapper.toDTO(undefined)).toBeNull();
    });
  });

  describe('fromDTO', () => {
    it('maps a full DTO to entity with enabled as number', () => {
      const dto = new UserDTO({
        id: 42,
        username: 'mario',
        email: 'mario@test.it',
        passwordHash: '$2b$12$hash',
        roles: ['CITIZEN'],
        enabled: true,
        externalUuid: 'uuid-abc',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });

      const entity = mapper.fromDTO(dto);

      expect(entity).toBeInstanceOf(User);
      expect(entity.id).toBe(42);
      expect(entity.username).toBe('mario');
      expect(entity.email).toBe('mario@test.it');
      expect(entity.passwordHash).toBe('$2b$12$hash');
      expect(entity.roles).toEqual(['CITIZEN']);
      expect(entity.enabled).toBe(1);
      expect(entity.externalUuid).toBe('uuid-abc');
      expect(entity.createdAt).toBe('2024-01-01');
      expect(entity.updatedAt).toBe('2024-01-02');
    });

    it('converts enabled=false to 0', () => {
      const dto = new UserDTO({ enabled: false });
      const entity = mapper.fromDTO(dto);
      expect(entity.enabled).toBe(0);
    });

    it('returns null for null input', () => {
      expect(mapper.fromDTO(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(mapper.fromDTO(undefined)).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves all fields through DTO -> entity -> DTO', () => {
      const original = new UserDTO({
        id: 100,
        username: 'luigi',
        email: 'luigi@test.it',
        passwordHash: '$2b$12$hash123',
        roles: ['CITIZEN', 'MANAGER'],
        enabled: true,
        externalUuid: 'luigi-uuid',
        createdAt: '2024-06-01',
        updatedAt: '2024-06-15'
      });

      const entity = mapper.fromDTO(original);
      const back = mapper.toDTO(entity);

      expect(back.id).toBe(original.id);
      expect(back.username).toBe(original.username);
      expect(back.email).toBe(original.email);
      expect(back.passwordHash).toBe(original.passwordHash);
      expect(back.roles).toEqual(original.roles);
      expect(back.enabled).toBe(original.enabled);
      expect(back.externalUuid).toBe(original.externalUuid);
      expect(back.createdAt).toBe(original.createdAt);
      expect(back.updatedAt).toBe(original.updatedAt);
    });
  });
});
