export interface GetMyReservationsResponse {
  success: boolean;
  message: string;
  data?: {
    future: ReservationItem[];
    past: ReservationItem[];
    cancelled: ReservationItem[];
  };
}

export interface ReservationItem {
  id: number;
  barbershopName: string;
  barbershopAvatar: string | null;
  barberName: string | null;
  barberAvatar: string | null;
  serviceType: string | null;
  price: number | null;
  date: number; // startTime as timestamp
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show';
  statusLabel: string; // Persian label for status
}

