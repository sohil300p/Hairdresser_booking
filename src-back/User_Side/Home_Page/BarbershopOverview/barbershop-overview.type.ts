export interface GetBarbershopOverviewRequest {
  barbershopId: number;
  lat?: number;
  lng?: number;
}

export interface BarbershopOverviewResponse {
  id: number;
  name: string;
  backgroundImage: string | null;
  avatar: string | null;
  isOpen: boolean;
  ratingCount: number;
  averageRating: number;
  distance?: number; // in km
  priceFrom: number | null;
  viewCount: number;
}

export interface GetBarbershopOverviewResponse {
  success: boolean;
  message: string;
  data?: BarbershopOverviewResponse;
}

