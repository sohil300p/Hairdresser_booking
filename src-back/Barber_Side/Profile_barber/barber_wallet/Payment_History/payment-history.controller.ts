import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getPaymentHistoryService } from './payment-history.service';

/**
 * Get Payment History Controller for Barber
 * GET /api/barber/wallet/payment-history
 */
export async function getPaymentHistoryController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const result = await getPaymentHistoryService(req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getPaymentHistoryController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

