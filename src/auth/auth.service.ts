import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt';
import { RefreshTokenResponse, VerifyTokenResponse, LogoutResponse } from './auth.type';

/**
 * Refresh token service
 */
export async function refreshTokenService(refreshToken: string): Promise<RefreshTokenResponse> {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    return {
      success: false,
      message: 'Invalid or expired refresh token',
    };
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  // Generate new tokens
  const newPayload = {
    sub: user.id,
    phone: user.phone,
    role: user.role,
  };

  const newToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  return {
    success: true,
    message: 'Token refreshed successfully',
    token: newToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Verify token service
 */
export async function verifyTokenService(token: string): Promise<VerifyTokenResponse> {
  const payload = verifyAccessToken(token);

  if (!payload) {
    return {
      success: false,
      message: 'Invalid or expired token',
    };
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  return {
    success: true,
    message: 'Token is valid',
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
    },
  };
}

/**
 * Logout service
*/
export async function logoutService(refreshToken?: string): Promise<LogoutResponse> {
  // just for example.
  return {
    success: true,
    message: 'Logged out successfully',
  };
}
