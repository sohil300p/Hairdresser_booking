import api from './api';

export interface Appointment {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  barberId: number | null;
  barberName: string | null;
  barbershopId: number | null;
  barbershopName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  startTime: string;
  endTime: string;
  status: string;
  priceTotal: number | null;
  paidAmount: number | null;
  createdAt: string;
}

export const appointmentsService = {
  getAllAppointments: async () => {
    try {
      const response = await api.get<{ success: boolean; appointments: Appointment[] }>('/admin/appointments');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch appointments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  },
};

