export interface PaymentHistoryItem {
  id: number;
  serviceType: string | null;
  serviceName: string | null;
  customerName: string | null;
  customerId: number | null;
  price: number;
  date: number; // timestamp
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

