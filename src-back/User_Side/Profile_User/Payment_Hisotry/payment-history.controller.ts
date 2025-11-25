import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { getPaymentHistoryService } from './payment-history.service';

/**
 * Get Payment History Controller
 * GET /api/payment-history
 */
export async function getPaymentHistoryController(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const customerId = req.user.id;
    const result = await getPaymentHistoryService(customerId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in getPaymentHistoryController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

