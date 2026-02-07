export interface CancellationTier {
  minHoursBefore: number;
  feePercent: number;
}

export interface ReservationRules {
  reservationPaymentPercent: number;
  cancellationPolicy: 'not_accepted' | 'tiered';
  cancellationTiers: CancellationTier[];
}

export interface GetReservationRulesResponse {
  success: boolean;
  data?: ReservationRules;
  message?: string;
}

export interface PutReservationRulesRequest {
  reservationPaymentPercent?: number;
  cancellationPolicy?: 'not_accepted' | 'tiered';
  cancellationTiers?: CancellationTier[];
}

export interface PutReservationRulesResponse {
  success: boolean;
  data?: ReservationRules;
  message?: string;
}
