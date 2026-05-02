import { api } from '../utils/api';

export type CancellationPolicy = 'not_accepted' | 'tiered';

export interface CancellationTier {
  minHoursBefore: number;
  feePercent: number;
}

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

export type PutReservationPolicyRequest = Partial<ReservationPolicyPayload>;

export async function getEffectivePolicy(params?: { serviceId?: number; barberId?: number }) {
  const qs = new URLSearchParams();
  if (params?.serviceId) qs.set('serviceId', String(params.serviceId));
  if (params?.barberId) qs.set('barberId', String(params.barberId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return api.get<{ success: boolean; data?: ReservationPolicyPayload; message?: string }>(
    `/barber/reservation-policies/effective${suffix}`
  );
}

export async function putBarbershopPolicy(body: PutReservationPolicyRequest) {
  return api.put<{ success: boolean; data?: ReservationPolicyPayload; message?: string }>(
    `/barber/reservation-policies/barbershop`,
    body
  );
}

