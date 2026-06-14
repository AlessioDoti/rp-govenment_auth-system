import { jest } from '@jest/globals';
import { UserPersistenceServiceImpl } from '../../../../src/persistence/service/UserPersistenceServiceImpl.js';
import { UserDTO } from '../../../../src/domain/dto/UserDTO.js';
import { User } from '../../../../src/persistence/entity/User.js';

describe('UserPersistenceServiceImpl', () => {
  let service;
  let userRepository;
  let userMapper;
  let roleRepository;
  let pool;

  function createUserDto(overrides = {}) {
    return new UserDTO({
      id: 1,
      username: 'mario',
      email: 'mario@test.it',
      passwordHash: '$2b$12$hash',
      roles: ['CITIZEN'],
      enabled: true,
      externalUuid: 'uuid-abc',
      ...overrides
    });
  }

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findByExternalUuid: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn()
    };
    userMapper = {
      fromDTO: jest.fn(),
      toDTO: jest.fn()
    };
    roleRepository = {
      findNamesByUserId: jest.fn(),
      findByName: jest.fn(),
      assignRoles: jest.fn()
    };
    const conn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    pool = {
      getConnection: jest.fn().mockResolvedValue(conn),
      query: jest.fn()
    };
    service = new UserPersistenceServiceImpl(userRepository, userMapper, roleRepository, pool);
  });

  describe('findByUsername', () => {
    it('returns enriched DTO when user is found', async () => {
      const entity = new User({ id: 1, username: 'mario', email: 'mario@test.it' });
      const dto = new UserDTO({ id: 1, username: 'mario', email: 'mario@test.it', roles: [] });
      const enriched = new UserDTO({ id: 1, username: 'mario', email: 'mario@test.it', roles: ['CITIZEN'] });

      userRepository.findByUsername.mockResolvedValue(entity);
      userMapper.toDTO.mockReturnValue(dto);
      roleRepository.findNamesByUserId.mockResolvedValue(['CITIZEN']);

      const result = await service.findByUsername('mario');

      expect(result).toBeInstanceOf(UserDTO);
      expect(result.roles).toEqual(['CITIZEN']);
    });

    it('returns null when user is not found', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      const result = await service.findByUsername('ghost');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns enriched DTO when found', async () => {
      const entity = new User({ id: 1, email: 'mario@test.it' });
      userRepository.findByEmail.mockResolvedValue(entity);
      userMapper.toDTO.mockReturnValue(new UserDTO({ id: 1, email: 'mario@test.it' }));
      roleRepository.findNamesByUserId.mockResolvedValue(['CITIZEN']);

      const result = await service.findByEmail('mario@test.it');
      expect(result).not.toBeNull();
      expect(result.roles).toEqual(['CITIZEN']);
    });

    it('returns null when not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      expect(await service.findByEmail('missing@test.it')).toBeNull();
    });
  });

  describe('findByUuid', () => {
    it('returns enriched DTO when found', async () => {
      const entity = new User({ id: 1, externalUuid: 'uuid-abc' });
      userRepository.findByExternalUuid.mockResolvedValue(entity);
      userMapper.toDTO.mockReturnValue(new UserDTO({ id: 1, externalUuid: 'uuid-abc' }));
      roleRepository.findNamesByUserId.mockResolvedValue(['ADMIN']);

      const result = await service.findByUuid('uuid-abc');
      expect(result.roles).toEqual(['ADMIN']);
    });

    it('returns null when not found', async () => {
      userRepository.findByExternalUuid.mockResolvedValue(null);
      expect(await service.findByUuid('unknown')).toBeNull();
    });
  });

  describe('findByInternalId', () => {
    it('returns enriched DTO when found', async () => {
      const entity = new User({ id: 42 });
      userRepository.findById.mockResolvedValue(entity);
      userMapper.toDTO.mockReturnValue(new UserDTO({ id: 42 }));
      roleRepository.findNamesByUserId.mockResolvedValue(['MANAGER']);

      const result = await service.findByInternalId(42);
      expect(result.id).toBe(42);
      expect(result.roles).toEqual(['MANAGER']);
    });

    it('returns null when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      expect(await service.findByInternalId(999)).toBeNull();
    });
  });

  describe('listAll', () => {
    it('returns enriched DTOs for all users', async () => {
      const entities = [new User({ id: 1 }), new User({ id: 2 })];
      userRepository.listAll.mockResolvedValue(entities);
      userMapper.toDTO.mockImplementation((e) => new UserDTO({ id: e.id }));
      pool.query.mockResolvedValue([
        [{ USER_ID: 1, NAME: 'CITIZEN' }, { USER_ID: 2, NAME: 'ADMIN' }],
        []
      ]);

      const result = await service.listAll();
      expect(result).toHaveLength(2);
      expect(result[0].roles).toEqual(['CITIZEN']);
      expect(result[1].roles).toEqual(['ADMIN']);
    });

    it('returns empty array when no users', async () => {
      userRepository.listAll.mockResolvedValue([]);
      expect(await service.listAll()).toEqual([]);
    });
  });

  describe('saveUser', () => {
    it('saves user, assigns roles in transaction, returns enriched DTO', async () => {
      const dto = createUserDto({ id: null });
      const entity = new User({ id: null, username: 'mario', email: 'mario@test.it' });
      const savedEntity = new User({ id: 5, username: 'mario', email: 'mario@test.it' });
      const savedDto = new UserDTO({ id: 5, username: 'mario', email: 'mario@test.it' });
      const enrichedDto = new UserDTO({ id: 5, username: 'mario', email: 'mario@test.it', roles: ['CITIZEN'] });

      userMapper.fromDTO.mockReturnValue(entity);
      userRepository.save.mockResolvedValue(savedEntity);
      userMapper.toDTO.mockReturnValue(savedDto);
      roleRepository.findNamesByUserId.mockResolvedValue(['CITIZEN']);

      const result = await service.saveUser(dto);

      expect(pool.getConnection).toHaveBeenCalled();
      expect(roleRepository.assignRoles).toHaveBeenCalled();
      expect(result.roles).toEqual(['CITIZEN']);
    });
  });

  describe('updateRoles', () => {
    it('validates role names, updates in transaction, returns enriched DTO', async () => {
      roleRepository.findByName.mockResolvedValue({ id: 1, name: 'ADMIN' });
      const entity = new User({ id: 1, externalUuid: 'uuid-abc' });
      userRepository.findByExternalUuid.mockResolvedValue(entity);
      userMapper.toDTO.mockReturnValue(new UserDTO({ id: 1, externalUuid: 'uuid-abc' }));
      roleRepository.findNamesByUserId.mockResolvedValue(['ADMIN', 'MANAGER']);

      const result = await service.updateRoles('uuid-abc', ['ADMIN', 'MANAGER']);

      expect(result).toBeInstanceOf(UserDTO);
      expect(result.roles).toEqual(['ADMIN', 'MANAGER']);
    });

    it('throws when a role name does not exist', async () => {
      roleRepository.findByName.mockResolvedValue(null);

      await expect(
        service.updateRoles('uuid-abc', ['NONEXISTENT'])
      ).rejects.toThrow(/does not exist/);
    });

    it('throws when user UUID does not exist', async () => {
      roleRepository.findByName.mockResolvedValue({ id: 1, name: 'ADMIN' });
      userRepository.findByExternalUuid.mockResolvedValue(null);

      await expect(
        service.updateRoles('unknown-uuid', ['ADMIN'])
      ).rejects.toThrow(/does not exist/);
    });
  });
});
