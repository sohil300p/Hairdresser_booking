import api from './api';

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

export async function getDefaultReservationPolicy(): Promise<ReservationPolicyPayload> {
  const { data } = await api.get<{ success: boolean; data?: ReservationPolicyPayload; message?: string }>(
    '/admin/reservation-policies/default'
  );
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load reservation policy defaults');
  return data.data;
}

export async function putDefaultReservationPolicy(payload: PutReservationPolicyRequest): Promise<ReservationPolicyPayload> {
  const { data } = await api.put<{ success: boolean; data?: ReservationPolicyPayload; message?: string }>(
    '/admin/reservation-policies/default',
    payload
  );
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to save reservation policy defaults');
  return data.data;
}

