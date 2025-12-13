import api from './api';

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
};

