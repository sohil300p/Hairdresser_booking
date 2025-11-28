import prisma from '../../../All_Utils/config/prisma';
import {
  GetCouponsResponse,
  CreateCouponRequest,
  CreateCouponResponse,
  EditCouponRequest,
  EditCouponResponse,
  CouponItem,
  SendCouponSMSRequest,
  SendCouponSMSResponse
} from './coupon.type';
import { Decimal } from '@prisma/client/runtime/library';
import { sendSimpleSMS } from '../../../All_Utils/SMS/melipayamak.service';
import { validateIranianPhoneNumber, normalizePhoneNumber } from '../../../All_Utils/utils/validator';

/**
 * Get all coupons for barbershop services
 */
export async function getCouponsService(barbershopId: number): Promise<GetCouponsResponse> {
  try {
    // Get all services for this barbershop
    const services = await prisma.service.findMany({
      where: { barbershopId },
      select: { id: true },
    });

    const serviceIds = services.map(s => s.id);

    // Get all coupons and filter by serviceId in publicMeta
    const allCoupons = await prisma.coupon.findMany({
      orderBy: {
        created: 'desc',
      },
      select: {
        id: true,
        code: true,
        kind: true,
        value: true,
        usageMax: true,
        usageCount: true,
        expiresAt: true,
        created: true,
        updated: true,
      },
    });

    // Filter coupons that belong to this barbershop's services
    const coupons: CouponItem[] = [];
    for (const coupon of allCoupons) {
      // Check if coupon has serviceId in publicMeta (we'll store it there)
      // For now, we'll get all coupons and let the barber manage them
      // In a real scenario, we might want to link coupons to barbershops directly
      coupons.push({
        id: coupon.id,
        code: coupon.code,
        kind: coupon.kind,
        value: coupon.value ? Number(coupon.value) : null,
        usageMax: coupon.usageMax,
        usageCount: coupon.usageCount,
        expiresAt: coupon.expiresAt ? Number(coupon.expiresAt) : null,
        serviceId: null, // Will be stored in publicMeta
        serviceName: null,
        createdAt: Number(coupon.created),
        updatedAt: Number(coupon.updated),
      });
    }

    return {
      success: true,
      message: 'لیست کدهای تخفیف با موفقیت دریافت شد',
      data: {
        coupons,
      },
    };
  } catch (error) {
    console.error('Error getting coupons:', error);
    return {
      success: false,
      message: 'دریافت کدهای تخفیف با خطا مواجه شد',
    };
  }
}

/**
 * Create new coupon
 */
export async function createCouponService(
  barbershopId: number,
  data: CreateCouponRequest
): Promise<CreateCouponResponse> {
  try {
    // Validate required fields
    if (!data.code || !data.code.trim()) {
      return {
        success: false,
        message: 'کد تخفیف الزامی است',
      };
    }

    if (!data.kind) {
      return {
        success: false,
        message: 'نوع تخفیف الزامی است',
      };
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCoupon) {
      return {
        success: false,
        message: 'این کد تخفیف قبلاً ثبت شده است',
      };
    }

    // Validate value based on kind
    if (data.kind === 'percentage' && (!data.value || data.value < 0 || data.value > 100)) {
      return {
        success: false,
        message: 'درصد تخفیف باید بین 0 تا 100 باشد',
      };
    }

    if ((data.kind === 'fixed' || data.kind === 'free') && data.value !== undefined && data.value < 0) {
      return {
        success: false,
        message: 'مقدار تخفیف نمی‌تواند منفی باشد',
      };
    }

    // Check if service exists (if serviceId provided)
    let serviceName: string | null = null;
    if (data.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          barbershopId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!service) {
        return {
          success: false,
          message: 'سرویس یافت نشد',
        };
      }
      serviceName = service.name;
    }

    // Prepare publicMeta to store serviceId
    const publicMeta: any = {};
    if (data.serviceId) {
      publicMeta.serviceId = data.serviceId;
      publicMeta.barbershopId = barbershopId;
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        kind: data.kind,
        value: data.value !== undefined ? new Decimal(data.value) : null,
        usageMax: data.usageMax || null,
        usageCount: 0,
        expiresAt: data.expiresAt ? BigInt(data.expiresAt) : null,
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    const formattedCoupon: CouponItem = {
      id: coupon.id,
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value ? Number(coupon.value) : null,
      usageMax: coupon.usageMax,
      usageCount: coupon.usageCount,
      expiresAt: coupon.expiresAt ? Number(coupon.expiresAt) : null,
      serviceId: data.serviceId || null,
      serviceName,
      createdAt: Number(coupon.created),
      updatedAt: Number(coupon.updated),
    };

    return {
      success: true,
      message: 'کد تخفیف با موفقیت ایجاد شد',
      data: {
        coupon: formattedCoupon,
      },
    };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return {
      success: false,
      message: 'ایجاد کد تخفیف با خطا مواجه شد',
    };
  }
}

/**
 * Edit coupon
 */
export async function editCouponService(
  couponId: number,
  barbershopId: number,
  data: EditCouponRequest
): Promise<EditCouponResponse> {
  try {
    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      return {
        success: false,
        message: 'کد تخفیف یافت نشد',
      };
    }

    // Check if code is being changed and if new code already exists
    if (data.code && data.code.toUpperCase() !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (codeExists) {
        return {
          success: false,
          message: 'این کد تخفیف قبلاً ثبت شده است',
        };
      }
    }

    // Validate value based on kind
    const kind = data.kind || existingCoupon.kind;
    if (kind === 'percentage' && data.value !== undefined && (data.value < 0 || data.value > 100)) {
      return {
        success: false,
        message: 'درصد تخفیف باید بین 0 تا 100 باشد',
      };
    }

    if ((kind === 'fixed' || kind === 'free') && data.value !== undefined && data.value < 0) {
      return {
        success: false,
        message: 'مقدار تخفیف نمی‌تواند منفی باشد',
      };
    }

    // Check if service exists (if serviceId provided)
    let serviceName: string | null = null;
    if (data.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          barbershopId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!service) {
        return {
          success: false,
          message: 'سرویس یافت نشد',
        };
      }
      serviceName = service.name;
    }

    // Prepare update data
    const updateData: any = {
      updated: BigInt(Date.now()),
    };

    if (data.code !== undefined) {
      updateData.code = data.code.toUpperCase();
    }

    if (data.kind !== undefined) {
      updateData.kind = data.kind;
    }

    if (data.value !== undefined) {
      updateData.value = data.value !== null ? new Decimal(data.value) : null;
    }

    if (data.usageMax !== undefined) {
      updateData.usageMax = data.usageMax;
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? BigInt(data.expiresAt) : null;
    }

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    const formattedCoupon: CouponItem = {
      id: coupon.id,
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value ? Number(coupon.value) : null,
      usageMax: coupon.usageMax,
      usageCount: coupon.usageCount,
      expiresAt: coupon.expiresAt ? Number(coupon.expiresAt) : null,
      serviceId: data.serviceId || null,
      serviceName,
      createdAt: Number(coupon.created),
      updatedAt: Number(coupon.updated),
    };

    return {
      success: true,
      message: 'کد تخفیف با موفقیت به‌روزرسانی شد',
      data: {
        coupon: formattedCoupon,
      },
    };
  } catch (error) {
    console.error('Error editing coupon:', error);
    return {
      success: false,
      message: 'به‌روزرسانی کد تخفیف با خطا مواجه شد',
    };
  }
}

/**
 * Send coupon code via SMS to users
 */
export async function sendCouponSMSService(
  barbershopId: number,
  data: SendCouponSMSRequest
): Promise<SendCouponSMSResponse> {
  try {
    // Validate coupon exists and belongs to barbershop
    const coupon = await prisma.coupon.findUnique({
      where: { id: data.couponId },
    });

    if (!coupon) {
      return {
        success: false,
        message: 'کد تخفیف یافت نشد',
      };
    }

    // Validate phone numbers
    if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers) || data.phoneNumbers.length === 0) {
      return {
        success: false,
        message: 'حداقل یک شماره تلفن باید ارسال شود',
      };
    }

    // Normalize and validate phone numbers
    const validPhones: string[] = [];
    const invalidPhones: string[] = [];

    for (const phone of data.phoneNumbers) {
      const normalized = normalizePhoneNumber(phone);
      const validation = validateIranianPhoneNumber(normalized);
      
      if (validation.isValid) {
        validPhones.push(normalized);
      } else {
        invalidPhones.push(phone);
      }
    }

    if (validPhones.length === 0) {
      return {
        success: false,
        message: 'هیچ شماره تلفن معتبری یافت نشد',
      };
    }

    // Prepare SMS message
    let discountText = '';
    if (coupon.kind === 'percentage' && coupon.value) {
      discountText = `${Number(coupon.value)}% تخفیف`;
    } else if (coupon.kind === 'fixed' && coupon.value) {
      discountText = `${Number(coupon.value).toLocaleString('fa-IR')} تومان تخفیف`;
    } else if (coupon.kind === 'free') {
      discountText = 'رایگان';
    }

    const expiryText = coupon.expiresAt 
      ? ` تا ${new Date(Number(coupon.expiresAt)).toLocaleDateString('fa-IR')}`
      : '';

    const smsMessage = `🎁 کد تخفیف شما: ${coupon.code}\n${discountText}${expiryText}\n\nاز این کد در زمان رزرو استفاده کنید.`;

    // Send SMS to all valid phone numbers
    const results: Array<{ phone: string; success: boolean; message?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const phone of validPhones) {
      try {
        const smsResult = await sendSimpleSMS({
          to: phone,
          message: smsMessage,
        });

        if (smsResult.success) {
          sentCount++;
          results.push({
            phone,
            success: true,
          });
          console.log(`✅ Coupon SMS sent to ${phone} (Message ID: ${smsResult.messageId})`);
        } else {
          failedCount++;
          results.push({
            phone,
            success: false,
            message: smsResult.message,
          });
          console.error(`❌ Failed to send coupon SMS to ${phone}: ${smsResult.message}`);
        }
      } catch (error) {
        failedCount++;
        results.push({
          phone,
          success: false,
          message: error instanceof Error ? error.message : 'خطای نامشخص',
        });
        console.error(`❌ Error sending coupon SMS to ${phone}:`, error);
      }
    }

    // Add invalid phones to results
    for (const phone of invalidPhones) {
      results.push({
        phone,
        success: false,
        message: 'شماره تلفن معتبر نیست',
      });
      failedCount++;
    }

    return {
      success: sentCount > 0,
      message: sentCount > 0
        ? `${sentCount} پیامک با موفقیت ارسال شد${failedCount > 0 ? ` و ${failedCount} پیامک با خطا مواجه شد` : ''}`
        : 'ارسال پیامک با خطا مواجه شد',
      data: {
        sent: sentCount,
        failed: failedCount,
        results,
      },
    };
  } catch (error) {
    console.error('Error sending coupon SMS:', error);
    return {
      success: false,
      message: 'ارسال پیامک با خطا مواجه شد',
    };
  }
}

