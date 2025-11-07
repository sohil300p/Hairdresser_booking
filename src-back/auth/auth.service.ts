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
      message: 'Refresh token نامعتبر یا منقضی شده است',
    };
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return {
      success: false,
      message: 'کاربر یافت نشد',
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
      message: 'Token با موفقیت به‌روزرسانی شد',
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
      message: 'Token نامعتبر یا منقضی شده است',
    };
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return {
      success: false,
      message: 'کاربر یافت نشد',
    };
  }

  return {
    success: true,
      message: 'Token معتبر است',
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
      message: 'خروج با موفقیت انجام شد',
  };
}
