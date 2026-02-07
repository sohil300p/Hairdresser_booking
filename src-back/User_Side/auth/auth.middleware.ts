import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../../All_Utils/utils/jwt';
import prisma from '../../All_Utils/config/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: 'customer' | 'admin' | 'staff_admin';
    userType?: 'customer' | 'barber';
    barberId?: number;
  };
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    console.log('❌ No token found in request');
    res.status(401).json({
      success: false,
      message: 'Access token الزامی است',
    });
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    console.log('❌ Token verification failed');
    res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Token نامعتبر یا منقضی شده است',
    });
    return;
  }

  try {
    // CRITICAL SECURITY CHECK: Verify user still exists in database
    const customer = await prisma.customer.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        role: true,
      },
    });

    if (!customer) {
      console.log('❌ User not found in database – forcing logout:', { id: payload.sub, phone: payload.phone });
      res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'کاربر یافت نشد - لطفاً مجدداً وارد شوید',
      });
      return;
    }

    // Check if user is a barber (informational only - barber records created on-demand)
    const barber = await prisma.barber.findFirst({
      where: { userRefId: customer.id },
      select: {
        id: true,
        userRefId: true,
      },
    });

    // Attach user info to request
    // Note: barberId may be undefined - barber records are created on-demand when accessing barber endpoints
    req.user = {
      id: customer.id,
      phone: customer.phone,
      role: customer.role,
      userType: barber ? 'barber' : 'customer',
      barberId: barber?.id,
    };

    next();
  } catch (error) {
    console.error('❌ Database error during authentication:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
    return;
  }
}

/**
 * Optional Authentication Middleware
 * Tries to authenticate but doesn't fail if token is missing
 */
export async function optionalAuthenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      try {
        // Verify user still exists in database
        const customer = await prisma.customer.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            phone: true,
            role: true,
          },
        });

        if (customer) {
          // Check if user is a barber
          const barber = await prisma.barber.findFirst({
            where: { userRefId: customer.id },
            select: {
              id: true,
              userRefId: true,
            },
          });

          req.user = {
            id: customer.id,
            phone: customer.phone,
            role: customer.role,
            userType: barber ? 'barber' : 'customer',
            barberId: barber?.id,
          };
        }
      } catch (error) {
        console.error('❌ Database error during optional authentication:', error);
        // Don't fail the request, just don't set user
      }
    }
  }

  next();
}
