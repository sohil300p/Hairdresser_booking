import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getPaymentHistoryService } from './payment-history.service';
import { ensureBarberRecord } from '../../utils/barber.utils';

/**
 * Get Payment History Controller for Barber
 * GET /api/barber/wallet/payment-history
 */
export async function getPaymentHistoryController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);

    const result = await getPaymentHistoryService(barberId);

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

