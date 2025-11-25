import dotenv from 'dotenv';
import { SendSMSRequest, SendSMSResponse } from './sms.type';

const soap = require('soap');

dotenv.config();

// Support both naming conventions
const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || process.env.MELLI_USERNAME || '';
const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || process.env.MELLI_PASSWORD || '';
const MELIPAYAMAK_FROM = process.env.MELIPAYAMAK_FROM || process.env.MELLI_SENDER || '';
const MELIPAYAMAK_AUTH_PATTERN_ID = process.env.MELIPAYAMAK_AUTH_PATTERN_ID || process.env.MELLI_AUTH_PATTERN_ID;

const MELIPAYAMAK_WSDL_URL = 'http://api.payamak-panel.com/post/send.asmx?wsdl';

/**
 * Create SOAP client for MeliPayamak
 */
async function createSoapClient() {
  return new Promise<any>((resolve, reject) => {
    soap.createClient(MELIPAYAMAK_WSDL_URL, (err, client) => {
      if (err) {
        reject(err);
      } else {
        resolve(client);
      }
    });
  });
}

/**
 * Send simple SMS via MeliPayamak using SOAP
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

    const client = await createSoapClient();
    
    const args = {
        username: MELIPAYAMAK_USERNAME,
        password: MELIPAYAMAK_PASSWORD,
        to: data.to,
        from: MELIPAYAMAK_FROM,
        text: data.message,
        isFlash: false,
    };

    return new Promise<SendSMSResponse>((resolve) => {
      client.SendSimpleSMS2(args, (err: any, result: any) => {
        if (err) {
          console.error('Error sending SMS via MeliPayamak SOAP:', err);
          resolve({
            success: false,
            message: `خطا در ارسال پیامک: ${err.message || 'خطای نامشخص'}`,
          });
          return;
        }

        // MeliPayamak SOAP returns result in SendSimpleSMS2Result field
        const response = result?.SendSimpleSMS2Result;

        console.log('📥 MeliPayamak SOAP Response:', JSON.stringify(result, null, 2));
        console.log('📊 Response value:', response, `(type: ${typeof response})`);

        // MeliPayamak error codes:
        // 1-10: Success (message ID)
        // 11: Invalid username/password
        // 12: Insufficient credit
        // 13: Invalid sender number
        // 14: Invalid recipient number
        // 15: Message text is empty
        // 16: Username or password is empty
        // 17: System error
        
        // MeliPayamak returns response as string or number
        const responseValue = typeof response === 'string' ? parseInt(response, 10) : response;
        
        if (typeof responseValue === 'number' && !isNaN(responseValue)) {
          if (responseValue > 0 && responseValue < 10) {
            // Success - message ID returned
            resolve({
        success: true,
        message: 'پیامک با موفقیت ارسال شد',
              messageId: responseValue.toString(),
              statusCode: 1,
            });
          } else {
            // Error code
            const errorMessages: Record<number, string> = {
              11: 'نام کاربری یا رمز عبور اشتباه است',
              12: 'اعتبار حساب کافی نیست',
              13: 'شماره فرستنده نامعتبر است',
              14: 'شماره گیرنده نامعتبر است',
              15: 'متن پیام خالی است',
              16: 'نام کاربری یا رمز عبور خالی است',
              17: 'خطای سیستم',
            };
            resolve({
              success: false,
              message: errorMessages[responseValue] || `خطای کد ${responseValue}`,
              statusCode: responseValue,
            });
          }
        } else if (typeof response === 'string' && response.length > 0) {
          // Try to parse as number
          const parsed = parseInt(response, 10);
          if (!isNaN(parsed)) {
            // It's a numeric string, handle as error code
            const errorMessages: Record<number, string> = {
              11: 'نام کاربری یا رمز عبور اشتباه است',
              12: 'اعتبار حساب کافی نیست',
              13: 'شماره فرستنده نامعتبر است',
              14: 'شماره گیرنده نامعتبر است',
              15: 'متن پیام خالی است',
              16: 'نام کاربری یا رمز عبور خالی است',
              17: 'خطای سیستم',
            };
            resolve({
              success: false,
              message: errorMessages[parsed] || `خطای کد ${parsed}`,
              statusCode: parsed,
            });
    } else {
            // It's a text error message
            resolve({
        success: false,
              message: `ارسال پیامک با خطا مواجه شد: ${response}`,
              statusCode: 0,
            });
    }
        } else {
          resolve({
        success: false,
            message: 'پاسخ نامعتبر از سرویس پیامک',
            statusCode: 0,
          });
        }
      });
    });
  } catch (error: any) {
    console.error('Error creating SOAP client or sending SMS:', error);
    return {
      success: false,
      message: `خطا در اتصال به سرویس پیامک: ${error.message || 'خطای نامشخص'}`,
    };
  }
}

/**
 * Send pattern-based SMS (template SMS) via MeliPayamak using SOAP
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

    const client = await createSoapClient();
    
    const args = {
        username: MELIPAYAMAK_USERNAME,
        password: MELIPAYAMAK_PASSWORD,
        to,
        bodyId: patternId,
        args: paramValues, // Array of parameter values for pattern placeholders {0}, {1}, etc.
    };

    return new Promise<SendSMSResponse>((resolve) => {
      client.SendByBaseNumber2(args, (err: any, result: any) => {
        if (err) {
          console.error('Error sending pattern SMS via MeliPayamak SOAP:', err);
          resolve({
            success: false,
            message: `خطا در ارسال پیامک: ${err.message || 'خطای نامشخص'}`,
          });
          return;
        }

        const response = result?.SendByBaseNumber2Result;
        
        // MeliPayamak returns response as string or number
        const responseValue = typeof response === 'string' ? parseInt(response, 10) : response;
        
        if (typeof responseValue === 'number' && !isNaN(responseValue)) {
          if (responseValue > 0 && responseValue < 10) {
            resolve({
        success: true,
        message: 'پیامک با موفقیت ارسال شد',
              messageId: responseValue.toString(),
              statusCode: 1,
            });
          } else {
            const errorMessages: Record<number, string> = {
              11: 'نام کاربری یا رمز عبور اشتباه است',
              12: 'اعتبار حساب کافی نیست',
              13: 'شماره فرستنده نامعتبر است',
              14: 'شماره گیرنده نامعتبر است',
              15: 'متن پیام خالی است',
              16: 'نام کاربری یا رمز عبور خالی است',
              17: 'خطای سیستم',
            };
            resolve({
              success: false,
              message: errorMessages[responseValue] || `خطای کد ${responseValue}`,
              statusCode: responseValue,
            });
          }
        } else if (typeof response === 'string' && response.length > 0) {
          const parsed = parseInt(response, 10);
          if (!isNaN(parsed)) {
            const errorMessages: Record<number, string> = {
              11: 'نام کاربری یا رمز عبور اشتباه است',
              12: 'اعتبار حساب کافی نیست',
              13: 'شماره فرستنده نامعتبر است',
              14: 'شماره گیرنده نامعتبر است',
              15: 'متن پیام خالی است',
              16: 'نام کاربری یا رمز عبور خالی است',
              17: 'خطای سیستم',
            };
            resolve({
              success: false,
              message: errorMessages[parsed] || `خطای کد ${parsed}`,
              statusCode: parsed,
            });
    } else {
            resolve({
        success: false,
              message: `ارسال پیامک با خطا مواجه شد: ${response}`,
              statusCode: 0,
            });
    }
        } else {
          resolve({
        success: false,
            message: 'پاسخ نامعتبر از سرویس پیامک',
            statusCode: 0,
          });
        }
      });
    });
  } catch (error: any) {
    console.error('Error creating SOAP client or sending pattern SMS:', error);
    return {
      success: false,
      message: `خطا در اتصال به سرویس پیامک: ${error.message || 'خطای نامشخص'}`,
    };
  }
}

/**
 * Send OTP SMS (uses pattern if configured, otherwise simple SMS)
 * For pattern SMS: MeliPayamak pattern should have placeholders like {0} for OTP code
 * Example pattern: "کد تایید شما: {0}\nاین کد تا 2 دقیقه معتبر است."
 */
export async function sendOTPSMS(phone: string, otp: string, expirySeconds: number = 120): Promise<SendSMSResponse> {
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
  // Convert seconds to minutes for display
  const minutes = Math.floor(expirySeconds / 60);
  const seconds = expirySeconds % 60;
  const timeText = minutes > 0 
    ? `${minutes} دقیقه${seconds > 0 ? ` و ${seconds} ثانیه` : ''}`
    : `${seconds} ثانیه`;
  
  const message = `کد تایید شما: ${otp}\n\nاین کد تا ${timeText} معتبر است.`;
  return await sendSimpleSMS({
    to: phone,
    message,
  });
}
