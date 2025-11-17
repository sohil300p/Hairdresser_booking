import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import {
  getAvailablePackagesService,
  purchasePackageService,
  getUserPackagesService,
} from './package.service';
import { PurchasePackageRequest } from './package.type';

/**
 * Get Available Packages Controller
 * GET /api/packages
 */
export async function getAvailablePackagesController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await getAvailablePackagesService();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getAvailablePackagesController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Purchase Package Controller
 * POST /api/packages/purchase
 */
export async function purchasePackageController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const data: PurchasePackageRequest = req.body;

    if (!data.packageId || !data.paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'شناسه پکیج و روش پرداخت الزامی است',
      });
      return;
    }

    const result = await purchasePackageService(
      data,
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in purchasePackageController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get User Packages Controller
 * GET /api/packages/my-packages
 */
export async function getUserPackagesController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const result = await getUserPackagesService(
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getUserPackagesController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

