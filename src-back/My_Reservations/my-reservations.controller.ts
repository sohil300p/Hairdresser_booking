import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { getMyReservationsService } from './my-reservations.service';

export async function getMyReservationsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    if (req.user.userType !== 'customer') {
      res.status(403).json({
        success: false,
        message: 'این API فقط برای مشتریان در دسترس است',
      });
      return;
    }

    const result = await getMyReservationsService(req.user.id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getMyReservationsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

