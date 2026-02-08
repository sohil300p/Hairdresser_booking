import api from './api';

export interface BarbershopReservationTier {
  minHoursBefore: number;
  feePercent: number;
}

export interface Barbershop {
  id: number;
  name: string;
  platformCommissionPercent: number | null;
  reservationPaymentPercent?: number | null;
  cancellationPolicy?: string | null;
  cancellationTiers?: BarbershopReservationTier[] | null;
}

export interface Barber {
  id: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  experienceYears: number | null;
  avatar: string | null;
  gender: string | null;
  walletBalance: number;
  barbershopCount: number;
  appointmentCount: number;
  barbershops?: Barbershop[];
}

export interface BarberAppointment {
  id: number;
  startTime: number;
  endTime: number;
  status: string;
  customerName: string | null;
  customerPhone: string;
  serviceName: string | null;
  barbershopName: string | null;
  priceTotal: number | null;
}

export interface BarbershopServiceItem {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  gender: string;
}

export const barbersService = {
  getAllBarbers: async () => {
    try {
      const response = await api.get<{ success: boolean; barbers: Barber[] }>('/admin/barbers');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch barbers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch barbers');
    }
  },
  setBarbershopCommission: async (shopId: number, platformCommissionPercent: number) => {
    try {
      const response = await api.put<{ success: boolean; message?: string }>(
        `/admin/barbershops/${shopId}/commission`,
        { platformCommissionPercent }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to set commission:', error);
      throw new Error(error.response?.data?.message || 'Failed to set commission');
    }
  },
  getBarberAppointments: async (barberId: number) => {
    const response = await api.get<{ success: boolean; appointments: BarberAppointment[] }>(
      `/admin/barbers/${barberId}/appointments`
    );
    return response.data;
  },
  getBarbershopServices: async (barbershopId: number) => {
    const response = await api.get<{ success: boolean; services: BarbershopServiceItem[] }>(
      `/admin/barbershops/${barbershopId}/services`
    );
    return response.data;
  },
  clearBarberReservations: async (barberId: number) => {
    const response = await api.post<{ success: boolean; cancelledCount?: number }>(
      `/admin/barbers/${barberId}/clear-reservations`
    );
    return response.data;
  },
  clearBarberFinancial: async (barberId: number) => {
    const response = await api.post<{ success: boolean; previousBalance?: number }>(
      `/admin/barbers/${barberId}/clear-financial`
    );
    return response.data;
  },
};

