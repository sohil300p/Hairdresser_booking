import prisma from '../config/prisma';
import { resolveReservationPolicy } from './reservation-policy.resolver';
import type { CancellationTier } from './reservation-policy.type';
import type { PutReservationPolicyRequest, ReservationPolicyPayload } from './reservation-policy.dto';

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const v = Math.round(value);
  return v > 0 ? v : fallback;
}

function validateTiers(tiers: CancellationTier[]): string | null {
  if (!Array.isArray(tiers) || tiers.length === 0) return 'cancellationTiers باید آرایه غیرخالی باشد';
  for (const t of tiers) {
    if (typeof t.minHoursBefore !== 'number' || typeof t.feePercent !== 'number') return 'ساختار cancellationTiers نامعتبر است';
    if (t.feePercent < 0 || t.feePercent > 100) return 'feePercent باید بین 0 و 100 باشد';
  }
  return null;
}

function validateReminderSchedule(minutes: number[]): string | null {
  if (!Array.isArray(minutes) || minutes.length === 0) return 'reminderScheduleMinutes باید آرایه غیرخالی باشد';
  for (const m of minutes) {
    if (typeof m !== 'number' || !Number.isFinite(m) || m <= 0) return 'reminderScheduleMinutes نامعتبر است';
  }
  return null;
}

function toUpdateData(data: PutReservationPolicyRequest): { update: any; error?: string } {
  const update: any = { updated: BigInt(Date.now()) };

  if (data.slotGranularityMinutes !== undefined) update.slotGranularityMinutes = clampPositiveInt(data.slotGranularityMinutes, 30);
  if (data.minAdvanceMinutes !== undefined) update.minAdvanceMinutes = clampPositiveInt(data.minAdvanceMinutes, 60);
  if (data.bufferBeforeMinutes !== undefined) update.bufferBeforeMinutes = Math.max(0, Math.round(data.bufferBeforeMinutes));
  if (data.bufferAfterMinutes !== undefined) update.bufferAfterMinutes = Math.max(0, Math.round(data.bufferAfterMinutes));
  if (data.maxBookingsPerSlot !== undefined) update.maxBookingsPerSlot = clampPositiveInt(data.maxBookingsPerSlot, 1);
  if (data.depositPercent !== undefined) update.depositPercent = clampPercent(data.depositPercent);

  if (data.cancellationPolicy !== undefined) update.cancellationPolicy = data.cancellationPolicy;
  if (data.cancellationTiers !== undefined) {
    const err = validateTiers(data.cancellationTiers);
    if (err) return { update: null, error: err };
    update.cancellationTiers = data.cancellationTiers as any;
  }
  if (data.reminderScheduleMinutes !== undefined) {
    const err = validateReminderSchedule(data.reminderScheduleMinutes);
    if (err) return { update: null, error: err };
    update.reminderSchedule = data.reminderScheduleMinutes as any;
  }

  update.created = BigInt(Date.now());
  return { update };
}

export async function getDefaultReservationPolicy(): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  try {
    const effective = await resolveReservationPolicy({});
    return { success: true, data: { ...effective, reminderScheduleMinutes: effective.reminderScheduleMinutes } as any };
  } catch (e) {
    console.error('getDefaultReservationPolicy error:', e);
    return { success: false, message: 'خطا در دریافت تنظیمات' };
  }
}

export async function putDefaultReservationPolicy(
  data: PutReservationPolicyRequest
): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  try {
    const { update, error } = toUpdateData(data);
    if (error) return { success: false, message: error };

    await prisma.reservationPolicyDefault.upsert({
      where: { id: 1 },
      create: { ...update },
      update: { ...update, created: undefined },
    });

    const effective = await resolveReservationPolicy({});
    return { success: true, data: effective as any };
  } catch (e) {
    console.error('putDefaultReservationPolicy error:', e);
    return { success: false, message: 'خطا در ذخیره تنظیمات' };
  }
}

export async function getEffectivePolicyForBarberShop(input: {
  barbershopId: number;
  serviceId?: number;
  barberId?: number;
}): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  try {
    const effective = await resolveReservationPolicy({
      barbershopId: input.barbershopId,
      serviceId: input.serviceId,
      barberId: input.barberId,
    });
    return { success: true, data: effective as any };
  } catch (e) {
    console.error('getEffectivePolicyForBarberShop error:', e);
    return { success: false, message: 'خطا در دریافت تنظیمات' };
  }
}

export async function putBarbershopPolicy(input: {
  barbershopId: number;
  data: PutReservationPolicyRequest;
}): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  const { update, error } = toUpdateData(input.data);
  if (error) return { success: false, message: error };

  try {
    await prisma.reservationPolicyBarbershop.upsert({
      where: { barbershopId: input.barbershopId },
      create: { barbershopId: input.barbershopId, ...update },
      update: { ...update, created: undefined },
    });
    const effective = await resolveReservationPolicy({ barbershopId: input.barbershopId });
    return { success: true, data: effective as any };
  } catch (e) {
    console.error('putBarbershopPolicy error:', e);
    return { success: false, message: 'خطا در ذخیره تنظیمات' };
  }
}

export async function putServicePolicy(input: {
  serviceId: number;
  barbershopId: number;
  data: PutReservationPolicyRequest;
}): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  const { update, error } = toUpdateData(input.data);
  if (error) return { success: false, message: error };

  try {
    // Guard: ensure service belongs to shop
    const service = await prisma.service.findFirst({ where: { id: input.serviceId, barbershopId: input.barbershopId }, select: { id: true } });
    if (!service) return { success: false, message: 'سرویس یافت نشد' };

    await prisma.reservationPolicyService.upsert({
      where: { serviceId: input.serviceId },
      create: { serviceId: input.serviceId, ...update },
      update: { ...update, created: undefined },
    });
    const effective = await resolveReservationPolicy({ barbershopId: input.barbershopId, serviceId: input.serviceId });
    return { success: true, data: effective as any };
  } catch (e) {
    console.error('putServicePolicy error:', e);
    return { success: false, message: 'خطا در ذخیره تنظیمات' };
  }
}

export async function putBarberPolicy(input: {
  ownerBarbershopId: number;
  targetBarberId: number;
  data: PutReservationPolicyRequest;
}): Promise<{ success: boolean; data?: ReservationPolicyPayload; message?: string }> {
  const { update, error } = toUpdateData(input.data);
  if (error) return { success: false, message: error };

  try {
    // Guard: ensure target barber is in this shop (owner or member)
    const isMember = await prisma.barbershopMember.findFirst({
      where: { barbershopId: input.ownerBarbershopId, barberId: input.targetBarberId },
      select: { id: true },
    });
    const isOwner = await prisma.barbershop.findFirst({
      where: { id: input.ownerBarbershopId, ownerId: input.targetBarberId },
      select: { id: true },
    });
    if (!isMember && !isOwner) return { success: false, message: 'این آرایشگر عضو آرایشگاه نیست' };

    await prisma.reservationPolicyBarber.upsert({
      where: { barberId: input.targetBarberId },
      create: { barberId: input.targetBarberId, ...update },
      update: { ...update, created: undefined },
    });
    const effective = await resolveReservationPolicy({ barbershopId: input.ownerBarbershopId, barberId: input.targetBarberId });
    return { success: true, data: effective as any };
  } catch (e) {
    console.error('putBarberPolicy error:', e);
    return { success: false, message: 'خطا در ذخیره تنظیمات' };
  }
}

