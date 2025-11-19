export interface PaymentHistoryItem {
  id: number;
  serviceType: string | null;
  serviceName: string | null;
  barbershopName: string | null;
  barbershopId: number | null;
  price: number;
  date: number; // timestamp as BigInt
  status: 'pending' | 'success' | 'failed';
  paymentMethod: 'cash' | 'card' | 'online' | 'wallet' | null;
  appointmentId: number;
}

export interface GetPaymentHistoryResponse {
  success: boolean;
  message: string;
  data?: {
    payments: PaymentHistoryItem[];
    total: number;
  };
}

