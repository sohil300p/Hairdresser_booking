import prisma from '../../config/prisma';
import {
  GetRevenueShareConfigResponse,
  CalculateRevenueShareRequest,
  CalculateRevenueShareResponse,
} from './revenue-share.type';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get revenue share configuration service
 * Class-oriented design for easy future changes
 */
export class RevenueShareCalculator {
  /**
   * Get active revenue share config
   */
  static async getActiveConfig(serviceType?: string, configName?: string) {
    const where: any = {
      active: true,
    };

    if (configName) {
      where.name = configName;
    }

    if (serviceType) {
      where.OR = [
        { serviceType: null }, // default config
        { serviceType },
      ];
    }

    // Get most specific config first
    const config = await (prisma as any).revenueShareConfig?.findFirst({
      where,
      orderBy: [
        { serviceType: 'desc' }, // non-null serviceType first
        { name: 'asc' },
      ],
    });

    // Fallback to default if no specific config found
    if (!config && serviceType) {
      return await (prisma as any).revenueShareConfig?.findFirst({
        where: {
          active: true,
          serviceType: null,
          name: configName || 'default',
        },
      });
    }

    return config;
  }

  /**
   * Calculate revenue share breakdown
   */
  static async calculate(
    amount: number,
    serviceType?: string,
    configName?: string
  ): Promise<{
    platformShare: number;
    barberShare: number;
    barbershopShare: number | null;
    platformPercent: number;
    barberPercent: number;
    barbershopPercent: number | null;
  }> {
    const config = await this.getActiveConfig(serviceType, configName);

    if (!config) {
      // Default: 20% platform, 80% barber
      return {
        platformShare: amount * 0.2,
        barberShare: amount * 0.8,
        barbershopShare: null,
        platformPercent: 20,
        barberPercent: 80,
        barbershopPercent: null,
      };
    }

    const platformPercent = Number(config.platformPercent);
    const barberPercent = Number(config.barberPercent);
    const barbershopPercent = config.barbershopPercent ? Number(config.barbershopPercent) : null;

    // Normalize percentages (ensure they sum to 100)
    const totalPercent = platformPercent + barberPercent + (barbershopPercent || 0);
    const normalizedPlatformPercent = (platformPercent / totalPercent) * 100;
    const normalizedBarberPercent = (barberPercent / totalPercent) * 100;
    const normalizedBarbershopPercent = barbershopPercent ? (barbershopPercent / totalPercent) * 100 : null;

    return {
      platformShare: (amount * normalizedPlatformPercent) / 100,
      barberShare: (amount * normalizedBarberPercent) / 100,
      barbershopShare: normalizedBarbershopPercent ? (amount * normalizedBarbershopPercent) / 100 : null,
      platformPercent: normalizedPlatformPercent,
      barberPercent: normalizedBarberPercent,
      barbershopPercent: normalizedBarbershopPercent,
    };
  }
}

/**
 * Get revenue share config service
 */
export async function getRevenueShareConfigService(
  serviceType?: string,
  configName?: string
): Promise<GetRevenueShareConfigResponse> {
  try {
    const config = await RevenueShareCalculator.getActiveConfig(serviceType, configName);

    if (!config) {
      return {
        success: false,
        message: 'پیکربندی تقسیم درآمد یافت نشد',
      };
    }

    return {
      success: true,
      message: 'پیکربندی تقسیم درآمد با موفقیت دریافت شد',
      config: {
        id: config.id,
        name: config.name,
        platformPercent: Number(config.platformPercent),
        barberPercent: Number(config.barberPercent),
        barbershopPercent: config.barbershopPercent ? Number(config.barbershopPercent) : null,
        serviceType: config.serviceType,
        active: config.active,
      },
    };
  } catch (error) {
    console.error('Error getting revenue share config:', error);
    return {
      success: false,
      message: 'دریافت پیکربندی تقسیم درآمد با خطا مواجه شد',
    };
  }
}

/**
 * Calculate revenue share service
 */
export async function calculateRevenueShareService(
  data: CalculateRevenueShareRequest
): Promise<CalculateRevenueShareResponse> {
  try {
    const { amount, serviceType, configName } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const breakdown = await RevenueShareCalculator.calculate(amount, serviceType, configName);

    return {
      success: true,
      message: 'محاسبه تقسیم درآمد با موفقیت انجام شد',
      breakdown: {
        total: amount,
        ...breakdown,
      },
    };
  } catch (error) {
    console.error('Error calculating revenue share:', error);
    return {
      success: false,
      message: 'محاسبه تقسیم درآمد با خطا مواجه شد',
    };
  }
}

