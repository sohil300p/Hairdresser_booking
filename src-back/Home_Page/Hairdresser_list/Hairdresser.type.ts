export interface GetBarbersRequest {
  lat?: number;
  lng?: number;
  radius?: number; // in km
}

export interface BarbershopResponse {
  id: number;
  name: string;
  distance?: number; // calculated distance in km
  averageRating: number;
  ratingCount: number;
  priceFrom: number | null; // min price from services
  isOpen: boolean;
  discountPercentage: number | null;
  avatar: string | null;
}

export interface GetBarbersResponse {
  success: boolean;
  message: string;
  data?: BarbershopResponse[];
}

export interface GetBarberByIdResponse {
  success: boolean;
  message: string;
  data?: BarbershopResponse;
}
