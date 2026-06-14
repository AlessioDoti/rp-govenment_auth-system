import { TokenResponseDTO } from '../../../../src/domain/dto/TokenResponseDTO.js';

describe('TokenResponseDTO', () => {
  describe('constructor', () => {
    it('stores all fields with default tokenType', () => {
      const dto = new TokenResponseDTO('access-123', 'refresh-456', 900);
      expect(dto.accessToken).toBe('access-123');
      expect(dto.refreshToken).toBe('refresh-456');
      expect(dto.expiresIn).toBe(900);
      expect(dto.tokenType).toBe('Bearer');
    });

    it('accepts custom tokenType', () => {
      const dto = new TokenResponseDTO('a', 'b', 3600, 'MAC');
      expect(dto.tokenType).toBe('MAC');
    });
  });

  describe('toJSON', () => {
    it('returns snake_case OAuth2 response', () => {
      const dto = new TokenResponseDTO('access-token', 'refresh-token', 900);
      const json = dto.toJSON();
      expect(json).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 900
      });
    });
  });
});
