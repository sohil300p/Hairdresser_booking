// Appointment Request/Response Types

export interface CheckAvailabilityRequest {
  barberId?: number;
  barbershopId?: number;
  date: string; // ISO date string (YYYY-MM-DD)
  serviceId?: number; // optional: to calculate duration
}

export interface CheckAvailabilityResponse {
  success: boolean;
  message: string;
  availableSlots?: Array<{
    time: string; // HH:MM format
    available: boolean;
  }>;
  date?: string;
}

export interface CreateAppointmentRequest {
  barberId?: number;
  barbershopId?: number;
  serviceId?: number;
  date: string; // ISO date string
  time: string; // HH:MM format
  locationType: 'customer_location' | 'barbershop_fixed';
  notes?: string;
  addonIds?: number[]; // optional service addons
  couponCode?: string; // optional coupon
  paymentMethod: 'wallet' | 'online' | 'card';
}

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  appointmentId?: number;
  publicRef?: string;
  paymentUrl?: string; // if paymentMethod is online
  authority?: string; // ZarrinPal authority if online payment
}

export interface GetAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    id: number;
    publicRef?: string | null;
    customerId: number;
    barberId: number | null;
    barbershopId: number | null;
    serviceId: number | null;
    startTime: number;
    endTime: number;
    status: string;
    locationType: string;
    notes: string | null;
    basePrice: number | null;
    addonsTotal: number | null;
    priceTotal: number | null;
    paidAmount: number | null;
    createdAt: number;
    updatedAt: number;
    customer?: any;
    barber?: any;
    service?: any;
    barbershop?: any;
  };
}

export interface GetAppointmentByRefResponse {
  success: boolean;
  message: string;
  appointment?: {
    publicRef: string;
    status: string;
    startTime: number;
    endTime: number;
    priceTotal: number | null;
    paidAmount: number | null;
    service?: { name?: string | null };
    barbershop?: { name?: string | null };
  };
}

export interface ListAppointmentsRequest {
  customerId?: number;
  barberId?: number;
  barbershopId?: number;
  status?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  page?: number;
  limit?: number;
}

export interface ListAppointmentsResponse {
  success: boolean;
  message: string;
  appointments?: Array<{
    id: number;
    customerId: number;
    barberId: number | null;
    barbershopId: number | null;
    serviceId: number | null;
    startTime: number;
    endTime: number;
    status: string;
    locationType: string;
    priceTotal: number | null;
    paidAmount: number | null;
    customer?: any;
    barber?: any;
    service?: any;
    barbershop?: any;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateAppointmentStatusRequest {
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show';
  note?: string;
}

export interface UpdateAppointmentStatusResponse {
  success: boolean;
  message: string;
  appointmentId?: number;
}

export interface CancelAppointmentRequest {
  reason?: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  message: string;
  refundAmount?: number;
  refundPercentage?: number;
  appointmentId?: number;
}

export interface RescheduleAppointmentRequest {
  date: string; // ISO date string
  time: string; // HH:MM format
}

export interface RescheduleAppointmentResponse {
  success: boolean;
  message: string;
  appointmentId?: number;
}

