import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface JwtPayload {
  sub: number; // user id
  phone: string;
  role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
}

/**
 * Generate access token for user after OTP verification
 */
export function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Generate refresh token for user
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && 'phone' in decoded && 'role' in decoded) {
      return decoded as unknown as JwtPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && 'phone' in decoded && 'role' in decoded) {
      return decoded as unknown as JwtPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}