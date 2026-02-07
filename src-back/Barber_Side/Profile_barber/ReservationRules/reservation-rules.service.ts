import prisma from '../../../All_Utils/config/prisma';
import type {
  ReservationRules,
  PutReservationRulesRequest,
} from './reservation-rules.type';

const DEFAULT_TIERS = [
  { minHoursBefore: 24, feePercent: 0 },
  { minHoursBefore: 12, feePercent: 20 },
  { minHoursBefore: 1, feePercent: 50 },
  { minHoursBefore: 0, feePercent: 100 },
];

export async function getReservationRulesService(
  barberId: number
): Promise<{ success: boolean; data?: ReservationRules; message?: string }> {
  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: barberId },
    select: {
      reservationPaymentPercent: true,
      cancellationPolicy: true,
      cancellationTiers: true,
    },
  });

  if (!barbershop) {
    return { success: false, message: 'آرایشگاه یافت نشد' };
  }

  const tiers = (barbershop.cancellationTiers as { minHoursBefore: number; feePercent: number }[] | null) ?? DEFAULT_TIERS;

  const rules: ReservationRules = {
    reservationPaymentPercent: barbershop.reservationPaymentPercent ?? 100,
    cancellationPolicy: (barbershop.cancellationPolicy as 'not_accepted' | 'tiered') ?? 'tiered',
    cancellationTiers: tiers,
  };

  return { success: true, data: rules };
}

export async function putReservationRulesService(
  barberId: number,
  data: PutReservationRulesRequest
): Promise<{ success: boolean; data?: ReservationRules; message?: string }> {
  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: barberId },
  });

  if (!barbershop) {
    return { success: false, message: 'آرایشگاه یافت نشد' };
  }

  const update: Record<string, unknown> = {};

  if (data.reservationPaymentPercent !== undefined) {
    const pct = Math.max(0, Math.min(100, data.reservationPaymentPercent));
    update.reservationPaymentPercent = pct;
  }

  if (data.cancellationPolicy !== undefined) {
    update.cancellationPolicy = data.cancellationPolicy;
  }

  if (data.cancellationTiers !== undefined) {
    if (!Array.isArray(data.cancellationTiers)) {
      return { success: false, message: 'cancellationTiers باید آرایه باشد' };
    }
    for (const t of data.cancellationTiers) {
      if (typeof t.minHoursBefore !== 'number' || typeof t.feePercent !== 'number') {
        return { success: false, message: 'هر tier باید minHoursBefore و feePercent داشته باشد' };
      }
      if (t.feePercent < 0 || t.feePercent > 100) {
        return { success: false, message: 'feePercent باید بین 0 و 100 باشد' };
      }
    }
    update.cancellationTiers = data.cancellationTiers;
  }

  const updated = await prisma.barbershop.update({
    where: { id: barbershop.id },
    data: update as any,
  });

  const tiers =
    (updated.cancellationTiers as { minHoursBefore: number; feePercent: number }[]) ??
    DEFAULT_TIERS;

  const rules: ReservationRules = {
    reservationPaymentPercent: updated.reservationPaymentPercent ?? 100,
    cancellationPolicy: (updated.cancellationPolicy as 'not_accepted' | 'tiered') ?? 'tiered',
    cancellationTiers: tiers,
  };

  return { success: true, data: rules };
}
