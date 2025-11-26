import { Request, Response } from 'express';
import { sendOtpService, verifyOtpService } from './otp.service';
import { SendOtpRequest, VerifyOtpRequest } from './otp.type';

/**
 * Send OTP Controller
 * POST /api/otp/send
 */
export async function sendOtpController(req: Request, res: Response): Promise<void> {
  try {
    const data: SendOtpRequest = req.body;

    // Input validation
    if (!data.phone || typeof data.phone !== 'string') {
      res.status(400).json({
        success: false,
        message: 'شماره تلفن الزامی است',
      });
      return;
    }

    // Sanitize input: trim whitespace
    const sanitizedData: SendOtpRequest = {
      phone: String(data.phone).trim(),
    };

    const result = await sendOtpService(sanitizedData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in sendOtpController:', error);
    res.status(500).json({
      success: false,
        message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Verify OTP Controller (also used as login endpoint)
 * POST /api/auth/login/otp
 * POST /api/otp/verify (legacy endpoint)
 */
export async function verifyOtpController(req: Request, res: Response): Promise<void> {
  try {
    const data: VerifyOtpRequest = req.body;

    // Input validation and sanitization
    if (!data.phone || typeof data.phone !== 'string') {
      res.status(400).json({
        success: false,
        message: 'شماره تلفن الزامی است',
      });
      return;
    }

    if (!data.otp || typeof data.otp !== 'string') {
      res.status(400).json({
        success: false,
        message: 'کد OTP الزامی است',
      });
      return;
    }

    // Sanitize inputs: trim whitespace and ensure string type
    const sanitizedData: VerifyOtpRequest = {
      phone: String(data.phone).trim(),
      otp: String(data.otp).trim(),
      userType: data.userType,
      gender: data.gender,
      fullName: data.fullName
    };

    // Additional validation: OTP must be exactly 4 digits
    if (!/^\d{4}$/.test(sanitizedData.otp)) {
      res.status(400).json({
        success: false,
        message: 'کد OTP باید دقیقاً 4 رقم باشد',
      });
      return;
    }

    const result = await verifyOtpService(sanitizedData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in verifyOtpController:', error);
    res.status(500).json({
      success: false,
        message: 'خطای داخلی سرور',
    });
  }
}

