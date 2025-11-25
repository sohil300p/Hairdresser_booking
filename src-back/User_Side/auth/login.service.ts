import prisma from '../../All_Utils/config/prisma';
import { generateAccessToken, generateRefreshToken } from '../../All_Utils/utils/jwt';
import { validateIranianPhoneNumber, normalizePhoneNumber } from '../../All_Utils/utils/validator';
import bcrypt from 'bcryptjs';
import { LoginWithPasswordRequest, LoginResponse } from './login.type';

/**
 * Login with phone and password service
 * Also handles automatic registration if user doesn't exist
 */
export async function loginWithPasswordService(
  data: LoginWithPasswordRequest,
  userType?: 'customer' | 'barber',
  gender?: 'male' | 'female' | 'other'
): Promise<LoginResponse> {
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
    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { phone },
    });

    let isNewUser = false;
    let barber = null;

    if (!customer) {
      // New user - create customer account
      if (!userType) {
        return {
          success: false,
          message: 'لطفاً نوع کاربری خود را مشخص کنید (customer یا barber)',
        };
      }

      if (!gender) {
        return {
          success: false,
          message: 'لطفاً جنسیت خود را مشخص کنید',
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create customer
      customer = await prisma.customer.create({
        data: {
          phone,
          passwordHash,
          gender: gender as any,
          role: userType === 'barber' ? 'customer' : 'customer', // All start as customer
          phoneVerified: true,
          created: BigInt(Date.now()),
          updated: BigInt(Date.now()),
        },
      });

      isNewUser = true;

      // If user is a barber, create barber record
      if (userType === 'barber') {
        barber = await prisma.barber.create({
          data: {
            userRefId: customer.id,
            phone: customer.phone,
            gender: gender as any,
            created: BigInt(Date.now()),
            updated: BigInt(Date.now()),
          },
        });
      }
    } else {
      // Existing user - verify password
      if (!customer.passwordHash) {
        return {
          success: false,
          message: 'این حساب کاربری با رمز عبور ثبت نشده است. لطفاً از روش OTP استفاده کنید',
        };
      }

      const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'رمز عبور اشتباه است',
        };
      }

      // Check if user is a barber
      barber = await prisma.barber.findFirst({
        where: { userRefId: customer.id },
      });
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLogin: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // Generate JWT tokens
    const payload = {
      sub: customer.id,
      phone: customer.phone,
      role: customer.role as 'customer' | 'admin' | 'staff_admin',
      userType: barber ? ('barber' as const) : ('customer' as const),
      barberId: barber?.id,
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      success: true,
      message: isNewUser
        ? 'حساب کاربری شما با موفقیت ایجاد شد'
        : 'ورود با موفقیت انجام شد',
      token,
      refreshToken,
      user: {
        id: customer.id,
        phone: customer.phone,
        fullName: customer.fullName,
        email: customer.email,
        avatar: customer.avatar,
        role: customer.role as 'customer' | 'admin' | 'staff_admin',
        userType: barber ? 'barber' : 'customer',
        barberId: barber?.id,
        gender: customer.gender as 'male' | 'female' | 'other' | null,
      },
      isNewUser,
    };
  } catch (error: any) {
    console.error('Error in loginWithPasswordService:', error);
    
    // Handle unique constraint violation (phone already exists)
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'این شماره تلفن قبلاً ثبت شده است',
      };
    }

    return {
      success: false,
      message: 'ورود با خطا مواجه شد',
    };
  }
}

