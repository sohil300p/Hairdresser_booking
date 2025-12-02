import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { logoutBarberService } from './logout.service';

/**
 * Logout Controller for Barber
 * POST /api/barber/logout
 */
export async function logoutBarberController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await logoutBarberService(refreshToken);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in logoutBarberController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}



