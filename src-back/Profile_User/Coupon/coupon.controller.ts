import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import {
  validateCouponService,
  getAvailableCouponsService,
} from './coupon.service';
import { ValidateCouponRequest } from './coupon.type';

/**
 * Validate Coupon Controller
 * POST /api/coupons/validate
 */
export async function validateCouponController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data: ValidateCouponRequest = req.body;

    if (!data.code) {
      res.status(400).json({
        success: false,
        message: 'کد کوپن الزامی است',
      });
      return;
    }

    const result = await validateCouponService(
      data,
      req.user?.id
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in validateCouponController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get Available Coupons Controller
 * GET /api/coupons/available
 */
export async function getAvailableCouponsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await getAvailableCouponsService();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getAvailableCouponsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

