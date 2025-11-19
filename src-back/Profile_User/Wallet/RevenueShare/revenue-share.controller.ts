import { Response } from 'express';
import { AuthRequest } from '../../../auth/auth.middleware';
import {
  getRevenueShareConfigService,
  calculateRevenueShareService,
} from './revenue-share.service';
import { CalculateRevenueShareRequest } from './revenue-share.type';

/**
 * Get Revenue Share Config Controller
 * GET /api/revenue-share/config
 */
export async function getRevenueShareConfigController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const serviceType = req.query.serviceType as string | undefined;
    const configName = req.query.configName as string | undefined;

    const result = await getRevenueShareConfigService(serviceType, configName);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getRevenueShareConfigController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Calculate Revenue Share Controller
 * POST /api/revenue-share/calculate
 */
export async function calculateRevenueShareController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data: CalculateRevenueShareRequest = req.body;

    if (!data.amount) {
      res.status(400).json({
        success: false,
        message: 'مبلغ الزامی است',
      });
      return;
    }

    const result = await calculateRevenueShareService(data);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in calculateRevenueShareController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

