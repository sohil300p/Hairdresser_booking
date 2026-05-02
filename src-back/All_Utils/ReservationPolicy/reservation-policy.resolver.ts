import prisma from '../config/prisma';
import type {
  CancellationTier,
  EffectiveReservationPolicy,
  ReservationPolicyContext,
  ReservationPolicyLayer,
  ReservationPolicyOverrides,
} from './reservation-policy.type';

const DEFAULT_CANCELLATION_TIERS: CancellationTier[] = [
  { minHoursBefore: 24, feePercent: 0 },
  { minHoursBefore: 12, feePercent: 20 },
  { minHoursBefore: 1, feePercent: 50 },
  { minHoursBefore: 0, feePercent: 100 },
];

const DEFAULT_REMINDER_SCHEDULE_MINUTES = [24 * 60, 2 * 60];

const BASE_DEFAULTS: Omit<EffectiveReservationPolicy, 'sources'> = {
  slotGranularityMinutes: 30,
  minAdvanceMinutes: 60,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  maxBookingsPerSlot: 1,
  depositPercent: 100,
  cancellationPolicy: 'tiered',
  cancellationTiers: DEFAULT_CANCELLATION_TIERS,
  reminderScheduleMinutes: DEFAULT_REMINDER_SCHEDULE_MINUTES,
};

function parseTiers(input: unknown): CancellationTier[] | null {
  if (!Array.isArray(input)) return null;
  const tiers: CancellationTier[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') return null;
    const t = item as Record<string, unknown>;
    const minHoursBefore = typeof t.minHoursBefore === 'number' ? t.minHoursBefore : NaN;
    const feePercent = typeof t.feePercent === 'number' ? t.feePercent : NaN;
    if (!Number.isFinite(minHoursBefore) || !Number.isFinite(feePercent)) return null;
    tiers.push({ minHoursBefore, feePercent });
  }
  return tiers;
}

function parseReminderScheduleMinutes(input: unknown): number[] | null {
  if (!Array.isArray(input)) return null;
  const result: number[] = [];
  for (const v of input) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
    result.push(v);
  }
  return result;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const v = Math.round(value);
  return v > 0 ? v : fallback;
}

function applyLayer(
  policy: EffectiveReservationPolicy,
  layer: ReservationPolicyLayer,
  overrides: ReservationPolicyOverrides | null | undefined
): void {
  if (!overrides) return;

  const setField = <K extends keyof Omit<EffectiveReservationPolicy, 'sources'>>(
    key: K,
    value: Omit<EffectiveReservationPolicy, 'sources'>[K]
  ) => {
    (policy as any)[key] = value;
    policy.sources[key] = layer;
  };

  if (overrides.slotGranularityMinutes != null) {
    setField('slotGranularityMinutes', clampPositiveInt(overrides.slotGranularityMinutes, policy.slotGranularityMinutes));
  }
  if (overrides.minAdvanceMinutes != null) {
    setField('minAdvanceMinutes', clampPositiveInt(overrides.minAdvanceMinutes, policy.minAdvanceMinutes));
  }
  if (overrides.bufferBeforeMinutes != null) {
    setField('bufferBeforeMinutes', Math.max(0, Math.round(overrides.bufferBeforeMinutes)));
  }
  if (overrides.bufferAfterMinutes != null) {
    setField('bufferAfterMinutes', Math.max(0, Math.round(overrides.bufferAfterMinutes)));
  }
  if (overrides.maxBookingsPerSlot != null) {
    setField('maxBookingsPerSlot', clampPositiveInt(overrides.maxBookingsPerSlot, policy.maxBookingsPerSlot));
  }
  if (overrides.depositPercent != null) {
    setField('depositPercent', clampPercent(overrides.depositPercent));
  }

  if (overrides.cancellationPolicy != null) {
    const v = String(overrides.cancellationPolicy);
    if (v === 'not_accepted' || v === 'tiered') {
      setField('cancellationPolicy', v);
    }
  }

  if (overrides.cancellationTiers != null) {
    const tiers = parseTiers(overrides.cancellationTiers);
    if (tiers) setField('cancellationTiers', tiers);
  }

  if (overrides.reminderSchedule != null) {
    const minutes = parseReminderScheduleMinutes(overrides.reminderSchedule);
    if (minutes) setField('reminderScheduleMinutes', minutes);
  }
}

export async function resolveReservationPolicy(
  ctx: ReservationPolicyContext
): Promise<EffectiveReservationPolicy> {
  const sources: EffectiveReservationPolicy['sources'] = {
    slotGranularityMinutes: 'default',
    minAdvanceMinutes: 'default',
    bufferBeforeMinutes: 'default',
    bufferAfterMinutes: 'default',
    maxBookingsPerSlot: 'default',
    depositPercent: 'default',
    cancellationPolicy: 'default',
    cancellationTiers: 'default',
    reminderScheduleMinutes: 'default',
  };

  const policy: EffectiveReservationPolicy = { ...BASE_DEFAULTS, sources };

  const [defaultRow, shopRow, serviceRow, barberRow] = await Promise.all([
    prisma.reservationPolicyDefault.findFirst(),
    ctx.barbershopId ? prisma.reservationPolicyBarbershop.findUnique({ where: { barbershopId: ctx.barbershopId } }) : null,
    ctx.serviceId ? prisma.reservationPolicyService.findUnique({ where: { serviceId: ctx.serviceId } }) : null,
    ctx.barberId ? prisma.reservationPolicyBarber.findUnique({ where: { barberId: ctx.barberId } }) : null,
  ]);

  // Apply in precedence order: default -> barbershop -> service -> barber
  applyLayer(policy, 'default', defaultRow as any);
  applyLayer(policy, 'barbershop', shopRow as any);
  applyLayer(policy, 'service', serviceRow as any);
  applyLayer(policy, 'barber', barberRow as any);

  // Safety: ensure tiers are sorted (descending minHoursBefore)
  policy.cancellationTiers = [...policy.cancellationTiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  return policy;
}

