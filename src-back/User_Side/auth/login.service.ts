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
          password: passwordHash,
          gender: gender as any,
          role: userType === 'barber' ? 'customer' : 'customer', // All start as customer
        },
      });

      isNewUser = true;

      // Create wallet for new customer
      try {
        const { ensureCustomerWallet } = await import('../../All_Utils/Wallet/wallet.utils');
        await ensureCustomerWallet(customer.id);
      } catch (error) {
        console.error('⚠️ Failed to create wallet for new customer:', error);
        // Don't fail the login if wallet creation fails
      }

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
        
        // Create wallet for new barber
        try {
          const { ensureBarberWallet } = await import('../../All_Utils/Wallet/wallet.utils');
          await ensureBarberWallet(barber.id);
        } catch (error) {
          console.error('⚠️ Failed to create wallet for new barber:', error);
          // Don't fail the login if wallet creation fails
        }
      }
    } else {
      // Existing user - verify password
      if (!customer.password) {
        return {
          success: false,
          message: 'این حساب کاربری با رمز عبور ثبت نشده است. لطفاً از روش OTP استفاده کنید',
        };
      }

      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'رمز عبور اشتباه است',
        };
      }

      // For admin panel access, verify user has admin role
      // This check can be done at the frontend level, but we validate here too
      if (customer.role !== 'admin' && customer.role !== 'staff_admin') {
        // Allow login but frontend should check role for admin panel access
        // We don't block here as the same endpoint is used for customer/barber login
      }

      // Check if user is a barber
      barber = await prisma.barber.findFirst({
        where: { userRefId: customer.id },
      });

      // Ensure wallet exists for existing customer (in case it wasn't created before)
      try {
        const { ensureCustomerWallet } = await import('../../All_Utils/Wallet/wallet.utils');
        await ensureCustomerWallet(customer.id);
      } catch (error) {
        console.error('⚠️ Failed to ensure wallet for existing customer:', error);
        // Don't fail the login if wallet creation fails
      }

      // Ensure wallet exists for existing barber (in case it wasn't created before)
      if (barber) {
        try {
          const { ensureBarberWallet } = await import('../../All_Utils/Wallet/wallet.utils');
          await ensureBarberWallet(barber.id);
        } catch (error) {
          console.error('⚠️ Failed to ensure wallet for existing barber:', error);
          // Don't fail the login if wallet creation fails
        }
      }
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLoginAt: new Date(),
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

