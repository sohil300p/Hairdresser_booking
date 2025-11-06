export interface GetBarbersRequest {
  lat?: number;
  lng?: number;
  radius?: number; // in km
}

export interface BarberResponse {
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
  distance?: number; // calculated distance in km
}

export interface GetBarbersResponse {
  success: boolean;
  message: string;
  data?: BarberResponse[];
}

export interface GetBarberByIdResponse {
  success: boolean;
  message: string;
  data?: BarberResponse;
}

