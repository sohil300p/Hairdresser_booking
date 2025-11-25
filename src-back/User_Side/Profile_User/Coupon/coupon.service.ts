import prisma from '../../../All_Utils/config/prisma';
import {
  ValidateCouponRequest,
  ValidateCouponResponse,
  GetAvailableCouponsResponse,
} from './coupon.type';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Validate coupon service
 */
export async function validateCouponService(
  data: ValidateCouponRequest,
  authenticatedUserId?: number
): Promise<ValidateCouponResponse> {
  try {
    const { code, amount } = data;

    if (!code) {
      return {
        success: false,
        message: 'کد کوپن الزامی است',
      };
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return {
        success: false,
        message: 'کد کوپن معتبر نیست',
        valid: false,
      };
    }

    // Check expiration
    if (coupon.expiresAt && BigInt(coupon.expiresAt) < BigInt(Date.now())) {
      return {
        success: false,
        message: 'کد کوپن منقضی شده است',
        valid: false,
      };
    }

    // Check usage limit
    if (coupon.usageMax && coupon.usageCount >= coupon.usageMax) {
      return {
        success: false,
        message: 'کد کوپن به حداکثر استفاده رسیده است',
        valid: false,
      };
    }

    // Check if user has already used this coupon
    if (authenticatedUserId) {
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          customerId: authenticatedUserId,
        },
      });

      if (existingUsage) {
        return {
          success: false,
          message: 'شما قبلاً از این کد کوپن استفاده کرده‌اید',
          valid: false,
        };
      }
    }

    // Calculate discount
    let discountAmount: number | undefined;
    let discountPercent: number | undefined;

    if (amount && coupon.value) {
      if (coupon.kind === 'percentage') {
        discountPercent = Number(coupon.value);
        discountAmount = (amount * Number(coupon.value)) / 100;
      } else if (coupon.kind === 'fixed') {
        discountAmount = Number(coupon.value);
      } else if (coupon.kind === 'free') {
        discountAmount = amount; // 100% discount
        discountPercent = 100;
      }
    }

    return {
      success: true,
      message: 'کد کوپن معتبر است',
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        kind: coupon.kind,
        value: coupon.value ? Number(coupon.value) : null,
        discountAmount,
        discountPercent,
      },
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      success: false,
      message: 'اعتبارسنجی کد کوپن با خطا مواجه شد',
      valid: false,
    };
  }
}

/**
 * Apply coupon to transaction
 */
export async function applyCouponService(
  couponId: number,
  customerId: number,
  appointmentId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Record coupon usage
    await prisma.couponUsage.create({
      data: {
        couponId,
        customerId,
        appointmentId: appointmentId || null,
        usedAt: BigInt(Date.now()),
      },
    });

    // Increment usage count
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message: 'کوپن با موفقیت اعمال شد',
    };
  } catch (error) {
    console.error('Error applying coupon:', error);
    return {
      success: false,
      message: 'اعمال کوپن با خطا مواجه شد',
    };
  }
}

/**
 * Get available coupons service
 */
export async function getAvailableCouponsService(): Promise<GetAvailableCouponsResponse> {
  try {
    const now = BigInt(Date.now());

    const allCoupons = await prisma.coupon.findMany({
      orderBy: {
        created: 'desc',
      },
    });

    // Filter coupons manually (Prisma doesn't support dynamic field comparison)
    const coupons = allCoupons.filter((coupon) => {
      // Check expiration
      if (coupon.expiresAt && coupon.expiresAt < now) {
        return false;
      }

      // Check usage limit
      if (coupon.usageMax && coupon.usageCount >= coupon.usageMax) {
        return false;
      }

      return true;
    });

    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value ? Number(coupon.value) : null,
      usageMax: coupon.usageMax,
      usageCount: coupon.usageCount,
      expiresAt: coupon.expiresAt ? Number(coupon.expiresAt) : null,
    }));

    return {
      success: true,
      message: 'کوپن‌های موجود با موفقیت دریافت شد',
      coupons: formattedCoupons,
    };
  } catch (error) {
    console.error('Error getting available coupons:', error);
    return {
      success: false,
      message: 'دریافت کوپن‌ها با خطا مواجه شد',
    };
  }
}

