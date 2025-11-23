import axios from 'axios';
import dotenv from 'dotenv';
import { SendSMSRequest, SendSMSResponse } from './sms.type';

dotenv.config();

// Support both naming conventions
const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || process.env.MELLI_USERNAME || '';
const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || process.env.MELLI_PASSWORD || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || process.env.MELLI_SENDER || '';
const MELIPAYAMAK_AUTH_PATTERN_ID = process.env.MELIPAYAMAK_AUTH_PATTERN_ID || process.env.MELLI_AUTH_PATTERN_ID;

const MELIPAYAMAK_BASE_URL = 'https://rest.payamak-panel.com/api';

/**
 * Send simple SMS via MeliPayamak
 */
export async function sendSimpleSMS(data: SendSMSRequest): Promise<SendSMSResponse> {
  try {
    if (!MELIPAYAMAK_USERNAME || !MELIPAYAMAK_PASSWORD || !MELIPAYAMAK_FROM) {
      console.warn('⚠️ MeliPayamak credentials not configured. SMS will not be sent.');
      return {
        success: false,
        message: 'سرویس پیامک پیکربندی نشده است',
      };
    }

    const response = await axios.post(
      `${MELIPAYAMAK_BASE_URL}/SendSimpleSMS2`,
      {
        username: MELIPAYAMAK_USERNAME,
        password: MELIPAYAMAK_PASSWORD,
        to: data.to,
        from: MELIPAYAMAK_FROM,
        text: data.message,
        isFlash: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    const result = response.data;

    // MeliPayamak returns different response formats
    // Check for success indicators
    if (result.StrRetStatus === 'Ok' || result.RetStatus === 1 || result.Value) {
      return {
        success: true,
        message: 'پیامک با موفقیت ارسال شد',
        messageId: result.Value?.toString() || result.RecId?.toString(),
        statusCode: result.RetStatus || 1,
      };
    } else {
      const errorMsg = result.StrRetStatus || result.RetStatus || 'خطای نامشخص';
      return {
        success: false,
        message: `ارسال پیامک با خطا مواجه شد: ${errorMsg}`,
        statusCode: result.RetStatus || 0,
      };
    }
  } catch (error: any) {
    console.error('Error sending SMS via MeliPayamak:', error);
    
    if (error.response) {
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error.response.data?.message || error.message}`,
        statusCode: error.response.status,
      };
    }

    return {
      success: false,
      message: 'خطا در اتصال به سرویس پیامک',
    };
  }
}

/**
 * Send pattern-based SMS (template SMS) via MeliPayamak using ByPattern endpoint
 */
export async function sendPatternSMS(
  to: string,
  patternId: number,
  patternParams: Record<string, string>
): Promise<SendSMSResponse> {
  try {
    if (!MELIPAYAMAK_USERNAME || !MELIPAYAMAK_PASSWORD) {
      console.warn('⚠️ MeliPayamak credentials not configured. SMS will not be sent.');
      return {
        success: false,
        message: 'سرویس پیامک پیکربندی نشده است',
      };
    }

    // Convert patternParams object to array of values in order
    // MeliPayamak expects parameters as array: [value1, value2, ...]
    // Pattern template uses {0}, {1}, {2}, etc.
    const paramValues = Object.keys(patternParams)
      .sort() // Sort keys to ensure consistent order
      .map((key) => patternParams[key]);

    const response = await axios.post(
      `${MELIPAYAMAK_BASE_URL}/SendByBaseNumber`,
      {
        username: MELIPAYAMAK_USERNAME,
        password: MELIPAYAMAK_PASSWORD,
        to,
        bodyId: patternId,
        args: paramValues, // Array of parameter values for pattern placeholders {0}, {1}, etc.
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const result = response.data;

    if (result.StrRetStatus === 'Ok' || result.RetStatus === 1 || result.Value) {
      return {
        success: true,
        message: 'پیامک با موفقیت ارسال شد',
        messageId: result.Value?.toString() || result.RecId?.toString(),
        statusCode: result.RetStatus || 1,
      };
    } else {
      const errorMsg = result.StrRetStatus || result.RetStatus || 'خطای نامشخص';
      return {
        success: false,
        message: `ارسال پیامک با خطا مواجه شد: ${errorMsg}`,
        statusCode: result.RetStatus || 0,
      };
    }
  } catch (error: any) {
    console.error('Error sending pattern SMS via MeliPayamak:', error);
    
    if (error.response) {
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error.response.data?.message || error.message}`,
        statusCode: error.response.status,
      };
    }

    return {
      success: false,
      message: 'خطا در اتصال به سرویس پیامک',
    };
  }
}

/**
 * Send OTP SMS (uses pattern if configured, otherwise simple SMS)
 * For pattern SMS: MeliPayamak pattern should have placeholders like {0} for OTP code
 * Example pattern: "کد تایید شما: {0}\nاین کد تا 60 ثانیه معتبر است."
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SendSMSResponse> {
  // Try pattern-based SMS first if pattern ID is configured
  if (MELIPAYAMAK_AUTH_PATTERN_ID) {
    try {
      // Pattern parameters: {0} = OTP code
      // If pattern has multiple parameters, add them in order: {0}, {1}, {2}, etc.
      const patternResult = await sendPatternSMS(phone, parseInt(MELIPAYAMAK_AUTH_PATTERN_ID), {
        '0': otp, // First parameter {0} = OTP code
      });
      
      if (patternResult.success) {
        return patternResult;
      }
      // Fallback to simple SMS if pattern fails
      console.warn('Pattern SMS failed, falling back to simple SMS');
    } catch (error) {
      console.warn('Pattern SMS failed, falling back to simple SMS:', error);
    }
  }

  // Use simple SMS as fallback
  const message = `کد تایید شما: ${otp}\n\nاین کد تا 60 ثانیه معتبر است.`;
  return await sendSimpleSMS({
    to: phone,
    message,
  });
}

