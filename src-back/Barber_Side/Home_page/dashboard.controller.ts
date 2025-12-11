import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import { getDashboardService } from './dashboard.service';

/**
 * Get dashboard data controller
 * GET /api/barber/home/dashboard
 */
export async function getDashboardController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const barberId = req.user.barberId;
    const result = await getDashboardService(barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getDashboardController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}


