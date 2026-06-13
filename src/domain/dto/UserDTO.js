/**
 * @fileoverview Domain DTO for a user, with Zod validation schemas.
 */

import { z } from 'zod';

/**
 * @class UserDTO
 * @classdesc Immutable-friendly value object representing an auth user.
 */
export class UserDTO {
  /**
   * @param {{
   *   id?: number|null,
   *   username?: string|null,
   *   email?: string|null,
   *   passwordHash?: string|null,
   *   roles?: string[]|null,
   *   enabled?: boolean|null,
   *   externalUuid?: string|null,
   *   createdAt?: Date|string|null,
   *   updatedAt?: Date|string|null
   * }} [props]
   */
  constructor({
    id = null, username = null, email = null,
    passwordHash = null, roles = null, enabled = null,
    externalUuid = null, createdAt = null, updatedAt = null
  } = {}) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.roles = roles;
    this.enabled = enabled;
    this.externalUuid = externalUuid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      uuid: this.externalUuid,
      username: this.username,
      email: this.email,
      roles: this.roles,
      enabled: this.enabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Safe projection — returns only fields safe for the client.
   * @returns {{ uuid: string, username: string, email: string, roles: string[] }}
   */
  toSafeJSON() {
    return {
      userId: this.id,
      uuid: this.externalUuid,
      username: this.username,
      email: this.email,
      roles: this.roles
    };
  }
}

/**
 * Zod schema for user registration.
 * @type {import('zod').ZodType}
 */
export const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must be at most 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email must be a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
});

/**
 * Zod schema for the token endpoint (password grant).
 * @type {import('zod').ZodType}
 */
export const tokenRequestSchema = z.object({
  grant_type: z.literal('password'),
  username: z.string({ required_error: 'Username is required' }),
  password: z.string({ required_error: 'Password is required' })
});

/**
 * Zod schema for refresh token grant.
 * @type {import('zod').ZodType}
 */
export const refreshTokenRequestSchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string({ required_error: 'Refresh token is required' })
});
