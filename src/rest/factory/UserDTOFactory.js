/***
 * @fileoverview Builds a UserDTO from a request object.
 */

import { UserDTO } from '../../domain/dto/UserDTO.js';
import { RegisterRequest } from '../request/RegisterRequest.js';

/**
 * @class UserDTOFactory
 * @classdesc Produces UserDTO instances from request objects.
 */
export class UserDTOFactory {
  /**
   * @param {RegisterRequest} request
   * @returns {{ username: string, email: string, password: string }}
   */
  getRegisterData(request) {
    return {
      username: request.username,
      email: request.email,
      password: request.password
    };
  }
}
