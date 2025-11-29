import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getCouponsService, createCouponService, editCouponService, sendCouponSMSService } from './coupon.service';
import { CreateCouponRequest, EditCouponRequest, SendCouponSMSRequest } from './coupon.type';
import prisma from '../../../All_Utils/config/prisma';
import { ensureBarberRecord } from '../utils/barber.utils';

/**
 * Get Coupons Controller
 * GET /api/barber/coupons
 */
export async function getCouponsController(req: AuthRequest, res: Response): Promise<void> {
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

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;
    const result = await getCouponsService(barbershopId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getCouponsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Create Coupon Controller
 * POST /api/barber/coupons
 */
export async function createCouponController(req: AuthRequest, res: Response): Promise<void> {
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

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    const createData: CreateCouponRequest = {
      code: req.body.code,
      kind: req.body.kind,
      value: req.body.value ? parseFloat(req.body.value) : undefined,
      usageMax: req.body.usageMax ? parseInt(req.body.usageMax) : undefined,
      expiresAt: req.body.expiresAt ? parseInt(req.body.expiresAt) : undefined,
      serviceId: req.body.serviceId ? parseInt(req.body.serviceId) : undefined,
    };

    // Validate
    if (!createData.code || !createData.code.trim()) {
      res.status(400).json({
        success: false,
        message: 'کد تخفیف الزامی است',
      });
      return;
    }

    if (!createData.kind || !['percentage', 'fixed', 'free'].includes(createData.kind)) {
      res.status(400).json({
        success: false,
        message: 'نوع تخفیف باید یکی از مقادیر percentage، fixed یا free باشد',
      });
      return;
    }

    const result = await createCouponService(barbershopId, createData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createCouponController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Edit Coupon Controller
 * PUT /api/barber/coupons/:id
 */
export async function editCouponController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه کد تخفیف نامعتبر است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    const editData: EditCouponRequest = {
      code: req.body.code,
      kind: req.body.kind,
      value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
      usageMax: req.body.usageMax !== undefined ? parseInt(req.body.usageMax) : undefined,
      expiresAt: req.body.expiresAt !== undefined ? parseInt(req.body.expiresAt) : undefined,
      serviceId: req.body.serviceId !== undefined ? parseInt(req.body.serviceId) : undefined,
    };

    // Validate at least one field
    if (
      editData.code === undefined &&
      editData.kind === undefined &&
      editData.value === undefined &&
      editData.usageMax === undefined &&
      editData.expiresAt === undefined &&
      editData.serviceId === undefined
    ) {
      res.status(400).json({
        success: false,
        message: 'حداقل یکی از فیلدها باید ارسال شود',
      });
      return;
    }

    const result = await editCouponService(couponId, barbershopId, editData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in editCouponController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Send Coupon SMS Controller
 * POST /api/barber/coupons/:id/send-sms
 */
export async function sendCouponSMSController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه کد تخفیف نامعتبر است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    // Parse phone numbers from request body
    let phoneNumbers: string[];
    try {
      phoneNumbers = typeof req.body.phoneNumbers === 'string' 
        ? JSON.parse(req.body.phoneNumbers) 
        : req.body.phoneNumbers || [];
    } catch {
      phoneNumbers = Array.isArray(req.body.phoneNumbers) ? req.body.phoneNumbers : [];
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'لیست شماره تلفن‌ها باید یک آرایه غیرخالی باشد',
      });
      return;
    }

    const sendData: SendCouponSMSRequest = {
      couponId,
      phoneNumbers,
    };

    const result = await sendCouponSMSService(barbershopId, sendData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in sendCouponSMSController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

