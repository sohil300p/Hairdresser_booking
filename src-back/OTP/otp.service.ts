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
      console.warn('⚠️ Redis not available, OTP will not be stored. Please start Redis for OTP verification to work.');
      // For testing purposes, we'll still send SMS even if Redis is not available
      // But OTP verification will fail without Redis
    }

    // Increment attempts counter (only if Redis is available)
    if (isRedisConnected()) {
      await incrementOtpAttempts(phone);
    }

    // Note: User account will be created after successful OTP verification
    // We don't create user here to avoid creating accounts for invalid OTP requests

    // Send OTP via MeliPayamak SMS service
    const smsResult = await sendOTPSMS(phone, otp);
    
    if (!smsResult.success) {
      console.error(`❌ Failed to send OTP SMS to ${phone}:`, smsResult.message);
      // Log OTP to console for development/debugging even if SMS fails
      console.log(`📱 OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds) - SMS failed`);
      
      // Still return success if OTP is stored in Redis (for development)
      // In production, you might want to return error if SMS fails
      return {
        success: true,
        message: 'کد OTP با موفقیت ارسال شد (توجه: ارسال پیامک با خطا مواجه شد)',
        expiresIn: OTP_EXPIRY_SECONDS,
        remainingAttempts: limitCheck.remaining - 1,
      };
    }

    console.log(`✅ OTP SMS sent successfully to ${phone} (Message ID: ${smsResult.messageId})`);
    console.log(`📱 OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds)`);

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
 */
export async function verifyOtpService(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  let { phone, otp } = data;

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

    // Check if user exists or is new
    let user = await prisma.customer.findUnique({
      where: { phone },
    });

    let isNewUser = false;

    if (!user) {
      // User is new - create new account
      user = await prisma.customer.create({
        data: {
          phone,
          role: 'customer', // Default role
          phoneVerified: true as any,
          lastLogin: BigInt(Date.now()) as any,
          created: BigInt(Date.now()) as any,
          updated: BigInt(Date.now()) as any,
        } as any,
      });
      isNewUser = true;
      console.log(`✅ New user account created for phone: ${phone} (ID: ${user.id})`);
    } else {
      // User exists - update last login time
      user = await prisma.customer.update({
        where: { phone },
        data: {
          phoneVerified: true as any,
          lastLogin: BigInt(Date.now()) as any,
          updated: BigInt(Date.now()) as any,
        } as any,
      });
      console.log(`✅ Existing user logged in: ${phone} (ID: ${user.id})`);
    }

    // Check if user is a barber
    const barber = await prisma.barber.findFirst({
      where: { userRefId: user.id } as any,
    });

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as 'customer' | 'admin' | 'staff_admin',
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
        id: user.id,
        phone: user.phone,
        firstName: null,
        lastName: null,
        profileImage: user.avatar,
        role: user.role.toUpperCase() as 'CUSTOMER' | 'BARBER' | 'ADMIN',
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
