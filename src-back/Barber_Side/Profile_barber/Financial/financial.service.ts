import prisma from '../../../All_Utils/config/prisma';

const DEFAULT_PLATFORM_PERCENT = 20;

export interface BarberFinancialConfig {
  platformCommissionPercent: number;
  barberPercent: number;
  exampleAmount: number;
  examplePlatformShare: number;
  exampleBarberShare: number;
  cancellationPolicy: 'not_accepted' | 'tiered';
  cancellationTiers: { minHoursBefore: number; feePercent: number }[];
  hasDeclaredCancellation: boolean;
}

export async function getBarberFinancialConfigService(
  barberId: number
): Promise<{ success: boolean; message?: string; data?: BarberFinancialConfig }> {
  try {
    const barbershop = await prisma.barbershop.findFirst({
      where: { ownerId: barberId },
      select: {
        platformCommissionPercent: true,
        cancellationPolicy: true,
        cancellationTiers: true,
      },
    });

    if (!barbershop) {
      return { success: false, message: 'سالن آرایشگاه یافت نشد' };
    }

    const platformPercent = barbershop.platformCommissionPercent ?? DEFAULT_PLATFORM_PERCENT;
    const barberPercent = 100 - platformPercent;

    const exampleAmount = 100_000;
    const examplePlatformShare = Math.round((exampleAmount * platformPercent) / 100);
    const exampleBarberShare = exampleAmount - examplePlatformShare;

    const tiers = (barbershop.cancellationTiers as { minHoursBefore: number; feePercent: number }[] | null) ?? [];
    const policy = (barbershop.cancellationPolicy as 'not_accepted' | 'tiered') ?? 'tiered';
    const hasDeclaredCancellation = policy === 'tiered' ? tiers.length > 0 : true;

    return {
      success: true,
      data: {
        platformCommissionPercent: platformPercent,
        barberPercent,
        exampleAmount,
        examplePlatformShare,
        exampleBarberShare,
        cancellationPolicy: policy,
        cancellationTiers: tiers,
        hasDeclaredCancellation,
      },
    };
  } catch (error) {
    console.error('Get barber financial config error:', error);
    return { success: false, message: 'خطا در دریافت تنظیمات مالی' };
  }
}
