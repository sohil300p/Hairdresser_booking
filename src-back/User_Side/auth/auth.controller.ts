import { Request, Response } from 'express';
import { refreshTokenService, verifyTokenService, logoutService } from './auth.service';

/**
 * Refresh Token Controller
 * POST /api/auth/refresh-token
 */
export async function refreshTokenController(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token الزامی است',
      });
      return;
    }

    const result = await refreshTokenService(refreshToken);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Error in refreshTokenController:', error);
    res.status(500).json({
      success: false,
        message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Verify Token Controller
 * POST /api/auth/verify-token
 */
export async function verifyTokenController(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token الزامی است',
      });
      return;
    }

    const result = await verifyTokenService(token);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Error in verifyTokenController:', error);
    res.status(500).json({
      success: false,
        message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Logout Controller
 * POST /api/auth/logout
 */
export async function logoutController(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const userId = (req as any).user?.id;
    const result = await logoutService(refreshToken, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in logoutController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}
