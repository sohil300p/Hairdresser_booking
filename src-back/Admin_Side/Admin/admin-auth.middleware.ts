import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../../All_Utils/utils/jwt';
import prisma from '../../All_Utils/config/prisma';

export interface AdminAuthRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: 'admin' | 'staff_admin';
    userType: 'admin';
    isAdmin: true;
  };
}

/**
 * Admin Authentication Middleware
 * Verifies JWT token and checks if user is admin
 */
export async function authenticateAdmin(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
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
      message: 'Token نامعتبر یا منقضی شده است',
    });
    return;
  }

  // Check if this is an admin token
  if (!payload.isAdmin || payload.userType !== 'admin') {
    console.log('❌ Not an admin token:', { userType: payload.userType, isAdmin: payload.isAdmin });
    res.status(403).json({
      success: false,
      message: 'شما دسترسی به این بخش را ندارید',
    });
    return;
  }

  try {
    // Verify admin still exists in Admin table
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      console.log('❌ Admin not found in database:', { id: payload.sub, phone: payload.phone });
      res.status(401).json({
        success: false,
        message: 'ادمین یافت نشد - لطفاً مجدداً وارد شوید',
      });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.log('❌ Admin account is inactive:', { id: payload.sub, phone: payload.phone });
      res.status(403).json({
        success: false,
        message: 'حساب کاربری شما غیرفعال شده است',
      });
      return;
    }

    // Attach admin info to request
    req.user = {
      id: admin.id,
      phone: admin.phone,
      role: admin.role as 'admin' | 'staff_admin',
      userType: 'admin',
      isAdmin: true,
    };

    console.log('✅ Admin authenticated:', { id: admin.id, role: admin.role });
    next();
  } catch (error) {
    console.error('❌ Database error during admin authentication:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
    return;
  }
}

