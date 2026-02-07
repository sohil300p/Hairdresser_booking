// Barber API response types - aligned with backend Barber_Side

export interface DashboardData {
  barberName: string | null;
  barbershopName: string | null;
  barbershopProfileImage: string | null;
  totalCustomers: number;
  activeReservations: number;
  weeklyRevenue: {
    sunday: number;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
  };
}

export interface GetDashboardResponse {
  success: boolean;
  message: string;
  data?: DashboardData;
}

export interface TodayAppointmentItem {
  id: number;
  customerId: number;
  customerName: string | null;
  customerAvatar: string | null;
  serviceId: number | null;
  serviceName: string | null;
  startTime: number;
  endTime: number;
  status: 'pending' | 'confirmed';
  priceTotal: number | null;
  paidAmount: number | null;
  notes: string | null;
}

export interface GetTodayAppointmentsResponse {
  success: boolean;
  message: string;
  data?: {
    appointments: TodayAppointmentItem[];
    total: number;
  };
}

export interface AppointmentItem {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  customerAvatar: string | null;
  serviceId: number | null;
  serviceName: string | null;
  startTime: number;
  endTime: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show';
  priceTotal: number | null;
  paidAmount: number | null;
  notes: string | null;
  createdAt: number;
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

export interface UpdateAppointmentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    appointmentId: number;
    status: string;
  };
}

export interface CustomerItem {
  id: number;
  fullName: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  gender: 'male' | 'female' | 'other' | null;
  visitCount: number;
  lastVisitDate: number | null;
  totalSpent: number;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface GetCustomersResponse {
  success: boolean;
  message: string;
  data?: {
    customers: CustomerItem[];
    total: number;
  };
}

export interface BarberProfileBarbershop {
  id: number;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  address: string | null;
  description: string | null;
  profileImage: string | null;
  backgroundImage: string | null;
}

export interface GetBarberProfileResponse {
  success: boolean;
  message: string;
  data?: {
    barbershop: BarberProfileBarbershop;
    services: Array<{
      id: number;
      name: string;
      description: string | null;
      price: number | null;
      estimatedTime: number;
      images: string[];
      avatar: string | null;
    }>;
    schedules: Array<{
      weekday: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }>;
  };
}

export interface ScheduleItem {
  weekday: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface GetWorkingHoursResponse {
  success: boolean;
  message: string;
  data?: {
    schedules: ScheduleItem[];
  };
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  description: string | null;
  avatar: string | null;
  files: string[];
  gender: 'male' | 'female' | 'other';
  isVip: boolean;
  isMedical: boolean;
  parentServiceId: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface GetServicesResponse {
  success: boolean;
  message: string;
  data?: {
    services: ServiceItem[];
  };
}

export interface CouponItem {
  id: number;
  code: string;
  kind: string;
  value: number | null;
  usageMax: number | null;
  usageCount: number;
  expiresAt: number | null;
  serviceId: number | null;
  serviceName: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface GetCouponsResponse {
  success: boolean;
  message: string;
  data?: {
    coupons: CouponItem[];
  };
}

export interface GetWalletBalanceResponse {
  success: boolean;
  message: string;
  balance?: number;
  currency?: string;
}

export interface PaymentHistoryItem {
  id: number;
  price: number;
  date: number;
  status: 'pending' | 'success' | 'failed';
  serviceName: string | null;
  customerName: string | null;
  customerId: number;
  paymentMethod: string | null;
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

export interface CommentItem {
  id: number;
  customerName: string | null;
  customerAvatar: string | null;
  comment: string | null;
  rate: number | null;
  serviceId: number | null;
  serviceName: string | null;
  appointmentStartTime: number | null;
  appointmentEndTime: number | null;
  createdAt: number;
}

export interface GetCommentsResponse {
  success: boolean;
  message: string;
  data?: {
    comments: CommentItem[];
    averageRating: number;
    totalComments: number;
  };
}
