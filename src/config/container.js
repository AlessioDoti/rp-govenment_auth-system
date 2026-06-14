/***
 * @fileoverview Hand-rolled composition root.
 *
 * Assembles every layer of the application explicitly so that the
 * wiring is visible (and inspectable from tests).
 */

import { getPool } from '../persistence/db.js';

import { UserRepository } from '../persistence/repository/UserRepository.js';
import { RefreshTokenRepository } from '../persistence/repository/RefreshTokenRepository.js';
import { RoleRepository } from '../persistence/repository/RoleRepository.js';

import { UserMapper } from '../persistence/mapper/UserMapper.js';

import { UserPersistenceServiceImpl } from '../persistence/service/UserPersistenceServiceImpl.js';
import { RefreshTokenPersistenceServiceImpl } from '../persistence/service/RefreshTokenPersistenceServiceImpl.js';

import { TokenService } from '../domain/service/TokenService.js';
import { AuthService } from '../domain/service/AuthService.js';
import { AuthRequestHandlerImpl } from '../domain/requesthandler/AuthRequestHandlerImpl.js';

import { UserDTOFactory } from '../rest/factory/UserDTOFactory.js';

/**
 * Builds the dependency container.
 *
 * @param {object} [overrides]
 * @returns {{
 *   pool: import('mysql2/promise').Pool,
 *   mappers: { userMapper: UserMapper },
 *   repositories: { userRepository: UserRepository, refreshTokenRepository: RefreshTokenRepository, roleRepository: RoleRepository },
 *   persistence: { userPersistenceService: UserPersistenceServiceImpl, refreshTokenPersistenceService: RefreshTokenPersistenceServiceImpl },
 *   services: { tokenService: TokenService, authService: AuthService },
 *   handlers: { authRequestHandler: AuthRequestHandlerImpl },
 *   factories: { userDTOFactory: UserDTOFactory }
 * }}
 */
export function buildContainer(overrides = {}) {
  const pool = overrides.db ?? getPool();

  // -- Persistence: mapper ---------------------------------------------------
  const userMapper = overrides.userMapper ?? new UserMapper();

  // -- Persistence: repositories ---------------------------------------------
  const userRepository = overrides.userRepository ?? new UserRepository(pool);
  const refreshTokenRepository = overrides.refreshTokenRepository ?? new RefreshTokenRepository(pool);
  const roleRepository = overrides.roleRepository ?? new RoleRepository(pool);

  // -- Persistence: services -------------------------------------------------
  const userPersistenceService = overrides.userPersistenceService
    ?? new UserPersistenceServiceImpl(userRepository, userMapper, roleRepository, pool);
  const refreshTokenPersistenceService = overrides.refreshTokenPersistenceService
    ?? new RefreshTokenPersistenceServiceImpl(refreshTokenRepository);

  // -- Domain services -------------------------------------------------------
  const tokenService = overrides.tokenService ?? new TokenService();
  const authService = overrides.authService
    ?? new AuthService(userPersistenceService, refreshTokenPersistenceService, tokenService);

  // -- Request handler -------------------------------------------------------
  const authRequestHandler = overrides.authRequestHandler
    ?? new AuthRequestHandlerImpl(authService);

  // -- REST factory ----------------------------------------------------------
  const userDTOFactory = overrides.userDTOFactory ?? new UserDTOFactory();

  return {
    pool,
    mappers: { userMapper },
    repositories: { userRepository, refreshTokenRepository, roleRepository },
    persistence: { userPersistenceService, refreshTokenPersistenceService },
    services: { tokenService, authService },
    handlers: { authRequestHandler },
    factories: { userDTOFactory }
  };
}
