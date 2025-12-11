export interface GetTodayAppointmentsResponse {
  success: boolean;
  message: string;
  data?: {
    appointments: Array<{
      id: number;
      customerId: number;
      customerName: string | null;
      customerAvatar: string | null;
      serviceId: number | null;
      serviceName: string | null;
      startTime: number; // timestamp
      endTime: number; // timestamp
      status: 'pending' | 'confirmed';
      priceTotal: number | null;
      paidAmount: number | null;
      notes: string | null;
    }>;
    total: number;
  };
}


