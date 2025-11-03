import { safeRedisOperation, isRedisConnected } from '../config/redis';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from './otp.type';

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
  const { phone } = data;

  // Validate phone format
  if (!phone || phone.length < 10) {
    return {
      success: false,
      message: 'Invalid phone number',
    };
  }

  // Check daily OTP limit
  const limitCheck = await checkOtpLimit(phone);
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: `Maximum OTP requests (${MAX_OTP_PER_DAY}) reached for today. Please try again tomorrow.`,
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
        message: 'OTP service temporarily unavailable. Please try again later.',
      };
    }

    // Increment attempts counter
    await incrementOtpAttempts(phone);

    // Find or create user in database
    await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
      },
    });

    // Send OTP (In production, integrate with SMS service)
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS} seconds)`);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_SECONDS,
      remainingAttempts: limitCheck.remaining - 1,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP service
 */
export async function verifyOtpService(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const { phone, otp } = data;

  if (!isRedisConnected()) {
    return {
      success: false,
      message: 'OTP service temporarily unavailable. Please request a new OTP after Redis is available.',
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
        message: 'OTP not found or expired. Please request a new OTP',
      };
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP',
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

    // Find or create user in database
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        lastLoginAt: new Date(),
      },
      create: {
        phone,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      success: true,
      message: 'OTP verified successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP',
    };
  }
}
