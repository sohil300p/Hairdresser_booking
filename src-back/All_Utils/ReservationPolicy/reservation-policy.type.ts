export type CancellationPolicy = 'not_accepted' | 'tiered';

export type ReservationPolicyLayer = 'default' | 'barbershop' | 'service' | 'barber';

export interface CancellationTier {
  minHoursBefore: number;
  feePercent: number;
}

export interface EffectiveReservationPolicy {
  slotGranularityMinutes: number;
  minAdvanceMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxBookingsPerSlot: number;
  depositPercent: number;
  cancellationPolicy: CancellationPolicy;
  cancellationTiers: CancellationTier[];
  reminderScheduleMinutes: number[];

  /**
   * Debug metadata (useful for admin tools/logging)
   * Indicates which layer provided each field.
   */
  sources: Record<keyof Omit<EffectiveReservationPolicy, 'sources'>, ReservationPolicyLayer>;
}

export interface ReservationPolicyContext {
  barbershopId?: number;
  serviceId?: number;
  barberId?: number;
}

export interface ReservationPolicyOverrides {
  slotGranularityMinutes?: number | null;
  minAdvanceMinutes?: number | null;
  bufferBeforeMinutes?: number | null;
  bufferAfterMinutes?: number | null;
  maxBookingsPerSlot?: number | null;
  depositPercent?: number | null;
  cancellationPolicy?: CancellationPolicy | string | null;
  cancellationTiers?: unknown | null;
  reminderSchedule?: unknown | null;
}

