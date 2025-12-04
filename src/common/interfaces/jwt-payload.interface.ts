/**
 * JWT Payload interface
 * Represents the data stored in JWT tokens
 */
export interface JwtPayload {
  sub: string; // User ID
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
