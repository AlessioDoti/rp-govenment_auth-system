/**
 * @fileoverview DTO wrapping the OAuth2 token response.
 */

/**
 * @class TokenResponseDTO
 * @classdesc OAuth2 token response sent to the client.
 */
export class TokenResponseDTO {
  /**
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {number} expiresIn  Seconds until access token expiry.
   * @param {string} [tokenType='Bearer']
   */
  constructor(accessToken, refreshToken, expiresIn, tokenType = 'Bearer') {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = tokenType;
    this.expiresIn = expiresIn;
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      token_type: this.tokenType,
      expires_in: this.expiresIn
    };
  }
}
