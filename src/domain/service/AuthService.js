/**
 * @fileoverview Domain service for authentication operations.
 *
 * Owns user registration and credential validation.
 * Password hashing is delegated to bcrypt.
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ValidatingService } from './ValidatingService.js';
import { TokenService } from './TokenService.js';
import { registerSchema } from '../dto/UserDTO.js';
import { UserDTO } from '../dto/UserDTO.js';
import { TokenResponseDTO } from '../dto/TokenResponseDTO.js';
import { ConflictError, UnauthorizedError } from '../error/AppError.js';

const BCRYPT_ROUNDS = 12;

/**
 * @class AuthService
 * @classdesc Encapsulates user registration and password validation.
 */
export class AuthService extends ValidatingService {
  /**
   * @param {import('../port/persistence/UserPersistenceService.js').UserPersistenceService} userPersistenceService
   * @param {import('../port/persistence/RefreshTokenPersistenceService.js').RefreshTokenPersistenceService} refreshTokenPersistenceService
   * @param {TokenService} tokenService
   */
  constructor(userPersistenceService, refreshTokenPersistenceService, tokenService) {
    super(registerSchema);
    this.userPersistenceService = userPersistenceService;
    this.refreshTokenPersistenceService = refreshTokenPersistenceService;
    this.tokenService = tokenService;
  }

  /**
   * Registers a new user with the default CITIZEN role.
   *
   * @param {string} username
   * @param {string} email
   * @param {string} plainPassword
   * @returns {Promise<UserDTO>}
   * @throws {ConflictError} When username or email already exists.
   */
  async register(username, email, plainPassword) {
    this.validate({ username, email, password: plainPassword });

    // Check uniqueness
    const existingUser = await this.userPersistenceService.findByUsername(username);
    if (existingUser) {
      throw new ConflictError(`Username '${username}' is already taken`);
    }
    const existingEmail = await this.userPersistenceService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError(`Email '${email}' is already registered`);
    }

    const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

    const dto = new UserDTO({
      username,
      email,
      passwordHash,
      roles: ['CITIZEN'],
      enabled: true,
      externalUuid: uuidv4()
    });

    return this.userPersistenceService.saveUser(dto);
  }

  /**
   * Validates credentials and issues a token pair.
   *
   * @param {string} username
   * @param {string} plainPassword
   * @returns {Promise<TokenResponseDTO>}
   * @throws {UnauthorizedError} When credentials are invalid.
   */
  async authenticate(username, plainPassword) {
    const user = await this.userPersistenceService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    if (!user.enabled) {
      throw new UnauthorizedError('Account is disabled');
    }

    const valid = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const { token: accessToken, expiresIn } = this.tokenService.createAccessToken(user);
    const refreshTokenString = this.tokenService.createRefreshTokenString();
    const refreshExpiry = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenPersistenceService.save(user.id, refreshTokenString, refreshExpiry);

    return new TokenResponseDTO(accessToken, refreshTokenString, expiresIn);
  }

  /**
   * Issues a new token pair from a valid refresh token.
   *
   * @param {string} refreshTokenString
   * @returns {Promise<TokenResponseDTO>}
   * @throws {UnauthorizedError} When the refresh token is invalid, expired, or revoked.
   */
  async refresh(refreshTokenString) {
    const stored = await this.refreshTokenPersistenceService.findValid(refreshTokenString);
    if (!stored) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userPersistenceService.findByInternalId(stored.userId);
    if (!user || !user.enabled) {
      // Clean up orphaned token
      await this.refreshTokenPersistenceService.revoke(refreshTokenString);
      throw new UnauthorizedError('User not found or disabled');
    }

    // Revoke old refresh token (rotation)
    await this.refreshTokenPersistenceService.revoke(refreshTokenString);

    const { token: accessToken, expiresIn } = this.tokenService.createAccessToken(user);
    const newRefreshToken = this.tokenService.createRefreshTokenString();
    const refreshExpiry = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenPersistenceService.save(user.id, newRefreshToken, refreshExpiry);

    return new TokenResponseDTO(accessToken, newRefreshToken, expiresIn);
  }

  /**
   * Validates a JWT access token and returns the payload.
   *
   * @param {string} token
   * @returns {{ sub: string, username: string, roles: string[] }|null}
   */
  validateToken(token) {
    return this.tokenService.verifyAccessToken(token);
  }
}
