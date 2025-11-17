import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { getProfileService } from './profile.service';

/**
 * Get Profile Controller
 * GET /api/profile
 */
export async function getProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User info is attached by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const userId = req.user.id;
    const result = await getProfileService(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getProfileController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

