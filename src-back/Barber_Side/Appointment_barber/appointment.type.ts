export interface AppointmentItem {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  customerAvatar: string | null;
  serviceId: number | null;
  serviceName: string | null;
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show';
  priceTotal: number | null;
  paidAmount: number | null;
  notes: string | null;
  createdAt: number; // timestamp
}

export interface GetAppointmentsRequest {
  status?: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show' | 'all';
  page?: number;
  limit?: number;
}

export interface GetAppointmentsResponse {
  success: boolean;
  message: string;
  data?: {
    appointments: AppointmentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UpdateAppointmentStatusRequest {
  status: 'pending' | 'confirmed' | 'cancelled';
  note?: string;
}

export interface UpdateAppointmentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    appointmentId: number;
    status: string;
  };
}

