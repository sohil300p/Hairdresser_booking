import prisma from '../../All_Utils/config/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../../All_Utils/utils/jwt';
import { validateIranianPhoneNumber, normalizePhoneNumber } from '../../All_Utils/utils/validator';

interface AdminLoginRequest {
  phone: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    phone: string;
    fullName: string;
    email: string | null;
    avatar: string | null;
    role: 'admin' | 'staff_admin';
    isActive: boolean;
  };
}

/**
 * Admin login service - searches ONLY in Admin table
 */
export async function adminLoginService(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  let { phone, password } = data;

  // Normalize phone number
  phone = normalizePhoneNumber(phone);

  // Validate Iranian phone number format
  const phoneValidation = validateIranianPhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      message: phoneValidation.message || 'شماره تلفن معتبر نیست',
    };
  }

  // Validate password
  if (!password || password.length < 6) {
    return {
      success: false,
      message: 'رمز عبور باید حداقل 6 کاراکتر باشد',
    };
  }

  try {
    // Search ONLY in Admin table
    const admin = await prisma.admin.findUnique({
      where: { phone },
    });

    if (!admin) {
      return {
        success: false,
        message: 'حساب کاربری ادمین با این شماره تلفن یافت نشد',
      };
    }

    // Check if admin is active
    if (!admin.isActive) {
      return {
        success: false,
        message: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'رمز عبور اشتباه است',
      };
    }

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT tokens
    const payload = {
      sub: admin.id,
      phone: admin.phone,
      role: admin.role as 'admin' | 'staff_admin',
      userType: 'admin' as const,
      isAdmin: true, // Flag to identify admin tokens
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create session (optional - for tracking)
    try {
      await prisma.userSession.create({
        data: {
          adminId: admin.id,
          token: token,
          refreshToken: refreshToken,
          expiresAt: BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          created: BigInt(Date.now()),
        },
      });
    } catch (error) {
      console.error('⚠️ Failed to create session:', error);
      // Don't fail login if session creation fails
    }

    return {
      success: true,
      message: 'ورود به پنل مدیریت با موفقیت انجام شد',
      token,
      refreshToken,
      user: {
        id: admin.id,
        phone: admin.phone,
        fullName: admin.fullName,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role as 'admin' | 'staff_admin',
        isActive: admin.isActive,
      },
    };
  } catch (error: any) {
    console.error('Error in adminLoginService:', error);
    return {
      success: false,
      message: 'ورود با خطا مواجه شد',
    };
  }
}

