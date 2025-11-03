import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
  };
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Attach user info to request
  req.user = {
    id: payload.sub,
    phone: payload.phone,
    role: payload.role,
  };

  next();
}

/**
 * Optional Authentication Middleware
 * Tries to authenticate but doesn't fail if token is missing
 */
export function optionalAuthenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        phone: payload.phone,
        role: payload.role,
      };
    }
  }

  next();
}

