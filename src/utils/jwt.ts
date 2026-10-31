import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const TOKEN_EXPIRATION = '1d'; // Token will automatically expire in 24 hours

interface TokenPayload {
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  username: string;
  displayName: string;
  email: string;
}


/**
 * Signs a new JSON Web Token containing the user's ID and permissions role.
 */
export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

/**
 * Verifies an existing token string and decodes its inner payload data.
 * Returns null if the token is forged, altered, or expired.
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
