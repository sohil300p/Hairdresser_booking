import { safeRedisOperation, isRedisConnected } from '../config/redis';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { validateIranianPhoneNumber, normalizePhoneNumber } from '../utils/validator';
import { SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from './otp.type';
import { sendOTPSMS } from '../SMS/melipayamak.service';

const OTP_EXPIRY_SECONDS = 60; // 60 seconds
const MAX_OTP_PER_DAY = 5; // Maximum 5 OTP requests per day per phone

/**
 * Generate a 4-digit OTP
 */
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Get Redis key for OTP
 */
function getOtpKey(phone: string): string {
  return `otp:${phone}`;
}

/**
 * Get Redis key for OTP attempts counter (daily)
 */
function getOtpAttemptsKey(phone: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `otp:attempts:${phone}:${today}`;
}

/**
 * Check if phone has exceeded daily OTP limit
 */
async function checkOtpLimit(phone: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!isRedisConnected()) {
    // If Redis is not available, allow the request (fail open)
    console.warn('⚠️ Redis not available, allowing OTP request');
    return { allowed: true, remaining: MAX_OTP_PER_DAY };
  }

  return await safeRedisOperation(
    async (client) => {
      const attemptsKey = getOtpAttemptsKey(phone);
      const attempts = await client.get(attemptsKey);
      const count = attempts ? parseInt(attempts, 10) : 0;

      if (count >= MAX_OTP_PER_DAY) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: MAX_OTP_PER_DAY - count };
    },
    { allowed: true, remaining: MAX_OTP_PER_DAY } // fallback
  );
}

/**
 * Increment OTP attempts counter
 */
async function incrementOtpAttempts(phone: string): Promise<void> {
  if (!isRedisConnected()) {
    return; // Skip if Redis not available
  }

  await safeRedisOperation(
    async (client) => {
      const attemptsKey = getOtpAttemptsKey(phone);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const secondsUntilMidnight = Math.floor((todayEnd.getTime() - Date.now()) / 1000);

      await client.incr(attemptsKey);
      await client.expire(attemptsKey, secondsUntilMidnight);
    },
    undefined // fallback
  );
}

/**
 * Send OTP service
 */
export async function sendOtpService(data: SendOtpRequest): Promise<SendOtpResponse> {
  let { phone } = data;

  // Normalize phone number (remove spaces, dashes, etc.)
  phone = normalizePhoneNumber(phone);

  // Validate Iranian phone number format
  const phoneValidation = validateIranianPhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      message: phoneValidation.message || 'شماره تلفن معتبر نیست',
    };
  }

  // Check daily OTP limit
  const limitCheck = await checkOtpLimit(phone);
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: `حداکثر درخواست OTP (${MAX_OTP_PER_DAY} بار) برای امروز انجام شده است. لطفاً فردا دوباره تلاش کنید.`,
      remainingAttempts: 0,
    };
  }

  // Generate 4-digit OTP
  const otp = generateOTP();

  try {
    // Store OTP in Redis with expiry (only if Redis is available)
    if (isRedisConnected()) {
      await safeRedisOperation(
        async (client) => {
          const otpKey = getOtpKey(phone);
          await client.setEx(otpKey, OTP_EXPIRY_SECONDS, otp);
        },
        undefined // fallback
      );
    } else {
      console.warn('⚠️ Redis not available, OTP will not be stored. Please start Redis for OTP to work.');
      return {
        success: false,
        message: 'سرویس OTP موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.',
      };
    }

    // Increment attempts counter
    await incrementOtpAttempts(phone);

    // Note: User account will be created after successful OTP verification
    // We don't create user here to avoid creating accounts for invalid OTP requests

    // Send OTP via MeliPayamak SMS service
    const smsResult = await sendOTPSMS(phone, otp);

    if (!smsResult.success) {
      // In development, log OTP to console if SMS fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds)`);
        console.warn('⚠️ SMS sending failed, but OTP is logged for development');
      }
      
      // Still return success if Redis is working (OTP is stored)
      // User can still verify OTP from Redis even if SMS fails
      return {
        success: true,
        message: 'کد OTP ایجاد شد. در صورت عدم دریافت پیامک، لطفاً با پشتیبانی تماس بگیرید.',
        expiresIn: OTP_EXPIRY_SECONDS,
        remainingAttempts: limitCheck.remaining - 1,
      };
    }

    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP sent via SMS to ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds)`);
    }

    return {
      success: true,
      message: 'کد OTP با موفقیت ارسال شد',
      expiresIn: OTP_EXPIRY_SECONDS,
      remainingAttempts: limitCheck.remaining - 1,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'ارسال کد OTP با خطا مواجه شد',
    };
  }
}

/**
 * Verify OTP service
 * Also handles automatic registration if user doesn't exist
 */
export async function verifyOtpService(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  let { phone, otp, userType, gender } = data;

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

  // Validate OTP format (should be 4 digits)
  if (!otp || !/^\d{4}$/.test(otp)) {
    return {
      success: false,
      message: 'کد OTP باید 4 رقم باشد',
    };
  }

  if (!isRedisConnected()) {
    return {
      success: false,
      message: 'سرویس OTP موقتاً در دسترس نیست. لطفاً پس از در دسترس بودن Redis، OTP جدید درخواست دهید.',
    };
  }

  try {
    // Get OTP from Redis
    const storedOtp = await safeRedisOperation(
      async (client) => {
        const otpKey = getOtpKey(phone);
        return await client.get(otpKey);
      },
      null // fallback
    );

    if (!storedOtp) {
      return {
        success: false,
        message: 'کد OTP یافت نشد یا منقضی شده است. لطفاً OTP جدید درخواست دهید',
      };
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return {
        success: false,
        message: 'کد OTP نامعتبر است',
      };
    }

    // OTP is valid - delete it from Redis
    await safeRedisOperation(
      async (client) => {
        const otpKey = getOtpKey(phone);
        await client.del(otpKey);
      },
      undefined // fallback
    );

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

      // Create customer
      customer = await prisma.customer.create({
        data: {
          phone,
          gender: gender as any,
          role: 'customer',
          phoneVerified: true,
          created: BigInt(Date.now()),
          updated: BigInt(Date.now()),
        },
      });

      isNewUser = true;
      console.log(`✅ New customer account created for phone: ${phone} (ID: ${customer.id})`);

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
        console.log(`✅ Barber record created for customer ID: ${customer.id} (Barber ID: ${barber.id})`);
      }
    } else {
      // Existing user - update last login time
      customer = await prisma.customer.update({
        where: { phone },
        data: {
          lastLogin: BigInt(Date.now()),
          updated: BigInt(Date.now()),
          phoneVerified: true,
        },
      });
      console.log(`✅ Existing customer logged in: ${phone} (ID: ${customer.id})`);

      // Check if user is a barber
      barber = await prisma.barber.findFirst({
        where: { userRefId: customer.id },
      });
    }

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
        ? 'کد OTP با موفقیت تایید شد. خوش آمدید! حساب کاربری شما ایجاد شد.'
        : 'کد OTP با موفقیت تایید شد',
      token,
      refreshToken,
      user: {
        id: customer.id,
        phone: customer.phone,
        firstName: customer.fullName?.split(' ')[0] || null,
        lastName: customer.fullName?.split(' ').slice(1).join(' ') || null,
        profileImage: customer.avatar,
        role: customer.role as 'CUSTOMER' | 'BARBER' | 'ADMIN',
        userType: barber ? 'barber' : 'customer',
        barberId: barber?.id,
      },
      isNewUser,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'تایید کد OTP با خطا مواجه شد',
    };
  }
}
