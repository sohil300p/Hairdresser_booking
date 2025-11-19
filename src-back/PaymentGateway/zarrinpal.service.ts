import axios from 'axios';
import dotenv from 'dotenv';
import {
  ZarrinPalPaymentRequest,
  ZarrinPalPaymentResponse,
  ZarrinPalVerifyRequest,
  ZarrinPalVerifyResponse,
} from './payment-gateway.type';

dotenv.config();

const ZARRINPAL_MERCHANT_ID = process.env.ZARRINPAL_MERCHANT_ID || '';
const ZARRINPAL_SANDBOX = process.env.ZARRINPAL_SANDBOX === 'true' || process.env.NODE_ENV === 'development';

// ZarrinPal API endpoints
const ZARRINPAL_BASE_URL = ZARRINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4'
  : 'https://api.zarinpal.com/pg/v4';

/**
 * Request payment from ZarrinPal
 */
export async function requestPayment(data: ZarrinPalPaymentRequest): Promise<ZarrinPalPaymentResponse> {
  try {
    if (!ZARRINPAL_MERCHANT_ID) {
      return {
        success: false,
        message: 'درگاه پرداخت پیکربندی نشده است',
      };
    }

    const requestData: any = {
      merchant_id: ZARRINPAL_MERCHANT_ID,
      amount: data.amount,
      description: data.description,
      callback_url: data.callbackUrl,
    };

    // Add optional fields
    if (data.mobile) {
      requestData.mobile = data.mobile;
    }
    if (data.email) {
      requestData.email = data.email;
    }
    if (data.metadata) {
      requestData.metadata = data.metadata;
    }

    const response = await axios.post(
      `${ZARRINPAL_BASE_URL}/payment/request.json`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 seconds timeout
      }
    );

    const result = response.data;

    // ZarrinPal v4 API response structure
    if (result.data && result.data.code === 100) {
      const authority = result.data.authority;
      const paymentUrl = ZARRINPAL_SANDBOX
        ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
        : `https://www.zarinpal.com/pg/StartPay/${authority}`;

      return {
        success: true,
        message: 'درخواست پرداخت با موفقیت ایجاد شد',
        authority,
        paymentUrl,
        status: result.data.code,
      };
    } else {
      const errorMessage = result.errors?.message || result.data?.message || 'خطای نامشخص';
      return {
        success: false,
        message: `خطا در ایجاد درخواست پرداخت: ${errorMessage}`,
        status: result.data?.code || 0,
      };
    }
  } catch (error: any) {
    console.error('Error requesting payment from ZarrinPal:', error);

    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.errors?.message || errorData?.message || error.message;
      return {
        success: false,
        message: `خطا در اتصال به درگاه پرداخت: ${errorMessage}`,
        status: error.response.status,
      };
    }

    return {
      success: false,
      message: 'خطا در اتصال به درگاه پرداخت',
    };
  }
}

/**
 * Verify payment with ZarrinPal
 */
export async function verifyPayment(data: ZarrinPalVerifyRequest): Promise<ZarrinPalVerifyResponse> {
  try {
    if (!ZARRINPAL_MERCHANT_ID) {
      return {
        success: false,
        message: 'درگاه پرداخت پیکربندی نشده است',
      };
    }

    const requestData = {
      merchant_id: ZARRINPAL_MERCHANT_ID,
      amount: data.amount,
      authority: data.authority,
    };

    const response = await axios.post(
      `${ZARRINPAL_BASE_URL}/payment/verify.json`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const result = response.data;

    // ZarrinPal v4 API response structure
    if (result.data && result.data.code === 100) {
      return {
        success: true,
        message: 'پرداخت با موفقیت تایید شد',
        refId: result.data.ref_id?.toString(),
        cardHash: result.data.card_hash,
        cardPan: result.data.card_pan,
        status: result.data.code,
      };
    } else {
      const errorMessage = result.errors?.message || result.data?.message || 'خطای نامشخص';
      const statusCode = result.data?.code || 0;

      // Common ZarrinPal error codes
      let message = errorMessage;
      if (statusCode === 101) {
        message = 'این تراکنش قبلاً تایید شده است';
      } else if (statusCode === -11) {
        message = 'درخواست یافت نشد';
      } else if (statusCode === -12) {
        message = 'امکان ویرایش درخواست وجود ندارد';
      } else if (statusCode === -21) {
        message = 'هیچ نوع عملیات مالی برای این تراکنش یافت نشد';
      } else if (statusCode === -22) {
        message = 'تراکنش ناموفق بود';
      } else if (statusCode === -33) {
        message = 'مبلغ تراکنش با مبلغ پرداخت شده مطابقت ندارد';
      } else if (statusCode === -34) {
        message = 'سقف تقسیم تراکنش از لحاظ تعداد یا رقم عبور کرده است';
      } else if (statusCode === -40) {
        message = 'اجازه دسترسی به متد مربوطه وجود ندارد';
      } else if (statusCode === -41) {
        message = 'اطلاعات ارسال شده مربوط به AdditionalData غیرمعتبر است';
      } else if (statusCode === -42) {
        message = 'مدت زمان معتبر طول عمر شناسه پرداخت باید بین 30 دقیقه تا 45 روز باشد';
      } else if (statusCode === -54) {
        message = 'درخواست مورد نظر آرشیو شده است';
      }

      return {
        success: false,
        message,
        status: statusCode,
      };
    }
  } catch (error: any) {
    console.error('Error verifying payment with ZarrinPal:', error);

    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.errors?.message || errorData?.message || error.message;
      return {
        success: false,
        message: `خطا در تایید پرداخت: ${errorMessage}`,
        status: error.response.status,
      };
    }

    return {
      success: false,
      message: 'خطا در اتصال به درگاه پرداخت',
    };
  }
}

