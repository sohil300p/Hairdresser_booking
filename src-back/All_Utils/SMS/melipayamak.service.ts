import dotenv from 'dotenv';
import { SendSMSRequest, SendSMSResponse } from './sms.type';

const soap = require('soap');

dotenv.config();

// Clear proxy settings that might be interfering with local development
// This addresses the ECONNRESET error when a local proxy (like v2ray at 127.0.0.1:10809) is active but not handling the connection correctly for this request.
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

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
    soap.createClient(MELIPAYAMAK_WSDL_URL, (err: any, client: any) => {
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
  // Note: OTP Service is configured to ONLY use pattern SMS.
  // This function remains for other non-OTP notifications if needed.
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
        
        // Check if response is a valid number (Message ID) or an error code
        // Error codes are typically small numbers (11-17), while Message IDs are large
        if (typeof responseValue === 'number' && !isNaN(responseValue)) {
          // If response value is large (e.g., > 1000), it's a Message ID => Success
          if (responseValue > 1000) { 
            // Success - message ID returned
            resolve({
              success: true,
              message: 'پیامک با موفقیت ارسال شد',
              messageId: responseValue.toString(),
              statusCode: 1,
            });
          } else {
            // Error codes are typically small numbers (1-17)
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
          if (!isNaN(parsed) && parsed > 1000) {
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

    // Note for MeliPayamak SOAP + node-soap:
    // Sometimes single-element arrays need to be wrapped carefully or passed as part of an object structure
    // that node-soap can interpret correctly as an array of strings.
    // However, based on common issues with SOAP array serialization:
    
    const client = await createSoapClient();
    
    // Use SendByBaseNumber as per documentation: https://www.melipayamak.com/api/sendbybasenumber/
    // Parameters: username, password, text (array), to, bodyId
    const args = {
        username: MELIPAYAMAK_USERNAME,
        password: MELIPAYAMAK_PASSWORD,
        text: { string: paramValues }, // Wrap array in object with 'string' key for SOAP array of strings serialization
        to,
        bodyId: patternId,
    };

    return new Promise<SendSMSResponse>((resolve) => {
      // Use SendByBaseNumber instead of SendByBaseNumber2
      client.SendByBaseNumber(args, (err: any, result: any) => {
        if (err) {
          console.error('Error sending pattern SMS via MeliPayamak SOAP:', err);
          resolve({
            success: false,
            message: `خطا در ارسال پیامک: ${err.message || 'خطای نامشخص'}`,
          });
          return;
        }

        // Result field is usually SendByBaseNumberResult
        const response = result?.SendByBaseNumberResult;
        
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
 * Send OTP SMS (uses pattern ONLY)
 * For pattern SMS: MeliPayamak pattern should have placeholders like {0} for OTP code
 * Example pattern: "کد تایید شما: {0}\nاین کد تا 2 دقیقه معتبر است."
 */
export async function sendOTPSMS(phone: string, otp: string, expirySeconds: number = 120): Promise<SendSMSResponse> {
  // Ensure pattern ID is configured
  if (!MELIPAYAMAK_AUTH_PATTERN_ID) {
    console.error('⚠️ MeliPayamak pattern ID not configured for OTP.');
    return {
      success: false,
      message: 'الگوی پیامک تایید پیکربندی نشده است',
    };
  }

  try {
    // Pattern parameters: {0} = OTP code
    // If pattern has multiple parameters, add them in order: {0}, {1}, {2}, etc.
    // Use only the OTP code as argument
    return await sendPatternSMS(phone, parseInt(MELIPAYAMAK_AUTH_PATTERN_ID), {
      '0': otp, 
    });
  } catch (error: any) {
    console.error('Pattern SMS failed:', error);
    return {
      success: false,
      message: `خطا در ارسال پیامک: ${error.message || 'خطای نامشخص'}`,
    };
  }
}
