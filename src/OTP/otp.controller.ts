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
    const result = await sendOtpService(data);

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
 * Verify OTP Controller
 * POST /api/otp/verify
 */
export async function verifyOtpController(req: Request, res: Response): Promise<void> {
  try {
    const data: VerifyOtpRequest = req.body;
    const result = await verifyOtpService(data);

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

