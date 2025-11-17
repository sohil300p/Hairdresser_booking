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

  // Verify customer still exists
  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
  });

  if (!customer) {
    return {
      success: false,
      message: 'کاربر یافت نشد',
    };
  }

  // Check if user is a barber
  const barber = await prisma.barber.findFirst({
    where: { userRefId: customer.id },
  });

  // Generate new tokens
  const newPayload = {
    sub: customer.id,
    phone: customer.phone,
    role: customer.role as 'customer' | 'admin' | 'staff_admin',
    userType: barber ? ('barber' as const) : ('customer' as const),
    barberId: barber?.id,
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

  // Verify customer still exists
  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
  });

  if (!customer) {
    return {
      success: false,
      message: 'کاربر یافت نشد',
    };
  }

  // Check if user is a barber
  const barber = await prisma.barber.findFirst({
    where: { userRefId: customer.id },
  });

  return {
    success: true,
      message: 'Token معتبر است',
    user: {
      id: customer.id,
      phone: customer.phone,
      role: customer.role as 'customer' | 'admin' | 'staff_admin',
      userType: barber ? 'barber' : 'customer',
      barberId: barber?.id,
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