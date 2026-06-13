/**
 * @fileoverview MySQL-backed implementation of the User persistence port.
 *
 * Orchestrates reads from UserRepository (USERS row) and enriches
 * every DTO with roles from RoleRepository (ROLES + USERS_ROLES).
 * Role writes (save/update) delegate to RoleRepository within a
 * transaction.
 */

import { UserPersistenceService } from '../../domain/port/persistence/UserPersistenceService.js';
import { ValidationError, NotFoundError } from '../../domain/error/AppError.js';

/**
 * @class UserPersistenceServiceImpl
 * @classdesc Concrete adapter that maps DTOs to entities, calls the
 * repositories, and maps the result back.
 */
export class UserPersistenceServiceImpl extends UserPersistenceService {
  /**
   * @param {import('../repository/UserRepository.js').UserRepository} userRepository
   * @param {import('../mapper/UserMapper.js').UserMapper} userMapper
   * @param {import('../repository/RoleRepository.js').RoleRepository} roleRepository
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(userRepository, userMapper, roleRepository, pool) {
    super();
    this.userRepository = userRepository;
    this.userMapper = userMapper;
    this.roleRepository = roleRepository;
    this.pool = pool;
  }

  /**
   * Enriches a User DTO with role names fetched from the junction table.
   *
   * @param {import('../../domain/dto/UserDTO.js').UserDTO|null} dto
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO|null>}
   * @private
   */
  async _enrichRoles(dto) {
    if (!dto) return null;
    const roles = await this.roleRepository.findNamesByUserId(dto.id);
    return new (Object.getPrototypeOf(dto).constructor)({
      ...dto,
      roles
    });
  }

  /**
   * Enriches an array of User DTOs with role names via a single batch query.
   *
   * @param {import('../../domain/dto/UserDTO.js').UserDTO[]} dtos
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO[]>}
   * @private
   */
  async _batchEnrichRoles(dtos) {
    if (dtos.length === 0) return dtos;

    const userIds = dtos.map((d) => d.id);
    const placeholders = userIds.map(() => '?').join(', ');

    const [rows] = await this.pool.query(
      `SELECT ur.USER_ID, r.NAME
       FROM USERS_ROLES ur
       JOIN ROLES r ON r.id = ur.ROLE_ID
       WHERE ur.USER_ID IN (${placeholders})
       ORDER BY ur.USER_ID, r.NAME`,
      userIds
    );

    // Build a map: userId -> string[]
    /** @type {Map<number, string[]>} */
    const rolesByUser = new Map();
    for (const row of rows) {
      const existing = rolesByUser.get(row.USER_ID) || [];
      existing.push(row.NAME);
      rolesByUser.set(row.USER_ID, existing);
    }

    return dtos.map((dto) => {
      const roles = rolesByUser.get(dto.id) || [];
      return new (Object.getPrototypeOf(dto).constructor)({
        ...dto,
        roles
      });
    });
  }

  /**
   * @param {import('../../domain/dto/UserDTO.js').UserDTO} dto
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO>}
   */
  async saveUser(dto) {
    const entity = this.userMapper.fromDTO(dto);
    const savedEntity = await this.userRepository.save(entity);

    // Assign default roles (CITIZEN) for new users
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.roleRepository.assignRoles(conn, savedEntity.id, dto.roles || ['CITIZEN']);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const savedDto = this.userMapper.toDTO(savedEntity);
    return this._enrichRoles(savedDto);
  }

  /**
   * @param {string} username
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO|null>}
   */
  async findByUsername(username) {
    const entity = await this.userRepository.findByUsername(username);
    return this._enrichRoles(this.userMapper.toDTO(entity));
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO|null>}
   */
  async findByEmail(email) {
    const entity = await this.userRepository.findByEmail(email);
    return this._enrichRoles(this.userMapper.toDTO(entity));
  }

  /**
   * @param {string} uuid
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO|null>}
   */
  async findByUuid(uuid) {
    const entity = await this.userRepository.findByExternalUuid(uuid);
    return this._enrichRoles(this.userMapper.toDTO(entity));
  }

  /**
   * @param {number} internalId
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO|null>}
   */
  async findByInternalId(internalId) {
    const entity = await this.userRepository.findById(internalId);
    return this._enrichRoles(this.userMapper.toDTO(entity));
  }

  /**
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO[]>}
   */
  async listAll() {
    const entities = await this.userRepository.listAll();
    const dtos = entities.map((e) => this.userMapper.toDTO(e));
    return this._batchEnrichRoles(dtos);
  }

  /**
   * Validates role names exist, then replaces the user's roles inside a
   * transaction.
   *
   * @param {string} uuid
   * @param {string[]} roles
   * @returns {Promise<import('../../domain/dto/UserDTO.js').UserDTO>}
   */
  async updateRoles(uuid, roles) {
    // Validate every role name exists in the ROLES catalogue
    for (const roleName of roles) {
      const role = await this.roleRepository.findByName(roleName);
      if (!role) {
        throw new ValidationError(`Role '${roleName}' does not exist`);
      }
    }

    const entity = await this.userRepository.findByExternalUuid(uuid);
    if (!entity) {
      throw new NotFoundError(`User with UUID ${uuid} does not exist`);
    }

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.roleRepository.assignRoles(conn, entity.id, roles);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return this._enrichRoles(this.userMapper.toDTO(entity));
  }
}
