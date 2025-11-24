import api from './api';

export interface Barber {
  id: number;
  userId: number;
  name: string;
  specialization: string | null;
  experienceYears: number | null;
  rating: number | null;
  bio: string | null;
  profileImage: string | null;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
  };
  distance?: number;
}

export interface GetBarbersParams {
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface GetBarbersResponse {
  success: boolean;
  message: string;
  data?: Barber[];
}

export interface GetBarberByIdResponse {
  success: boolean;
  message: string;
  data?: Barber;
}

export const barberService = {
  async getBarbers(params?: GetBarbersParams): Promise<GetBarbersResponse> {
    const response = await api.get<GetBarbersResponse>('/barbers', { params });
    return response.data;
  },

  async getBarberById(id: number): Promise<GetBarberByIdResponse> {
    const response = await api.get<GetBarberByIdResponse>(`/barbers/${id}`);
    return response.data;
  },
};

