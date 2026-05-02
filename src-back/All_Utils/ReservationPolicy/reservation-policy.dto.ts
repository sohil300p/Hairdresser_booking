import type { CancellationPolicy, CancellationTier } from './reservation-policy.type';

export interface ReservationPolicyPayload {
  slotGranularityMinutes: number;
  minAdvanceMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxBookingsPerSlot: number;
  depositPercent: number;
  cancellationPolicy: CancellationPolicy;
  cancellationTiers: CancellationTier[];
  reminderScheduleMinutes: number[];
}

export interface PutReservationPolicyRequest {
  slotGranularityMinutes?: number;
  minAdvanceMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  maxBookingsPerSlot?: number;
  depositPercent?: number;
  cancellationPolicy?: CancellationPolicy;
  cancellationTiers?: CancellationTier[];
  reminderScheduleMinutes?: number[];
}

