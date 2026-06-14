/***
 * @fileoverview Maps between User (persistence row) and UserDTO (domain object).
 */

import { User } from '../entity/User.js';
import { UserDTO } from '../../domain/dto/UserDTO.js';

/**
 * @class UserMapper
 * @classdesc Bidirectional mapper for the User aggregate.
 */
export class UserMapper {
  /**
   * Domain DTO → persistence entity.
   *
   * @param {import('../../domain/dto/UserDTO.js').UserDTO|null|undefined} dto
   * @returns {User|null}
   */
  fromDTO(dto) {
    if (!dto) return null;
    return new User({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      passwordHash: dto.passwordHash,
      roles: dto.roles,                // string[] — not persisted in USERS directly
      enabled: dto.enabled ? 1 : 0,
      externalUuid: dto.externalUuid,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  /**
   * Persistence entity → domain DTO.
   *
   * @param {User|null|undefined} entity
   * @returns {import('../../domain/dto/UserDTO.js').UserDTO|null}
   */
  toDTO(entity) {
    if (!entity) return null;
    return new UserDTO({
      id: entity.id,
      username: entity.username,
      email: entity.email,
      passwordHash: entity.passwordHash,
      roles: Array.isArray(entity.roles) ? entity.roles : [],
      enabled: entity.enabled === 1 || entity.enabled === true,
      externalUuid: entity.externalUuid,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    });
  }
}
