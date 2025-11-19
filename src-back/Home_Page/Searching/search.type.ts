export interface SearchRequest {
  query: string; // نام سرویس یا آرایشگاه
  lat?: number;
  lng?: number;
  radius?: number; // در کیلومتر
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data?: {
    barbershops: BarbershopSearchResult[];
    services: ServiceSearchResult[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BarbershopSearchResult {
  id: number;
  name: string;
  avatar: string | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  averageRating: number;
  ratingCount: number;
  priceFrom: number | null;
  isOpen: boolean;
  distance?: number;
  discountPercentage: number | null;
}

export interface ServiceSearchResult {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  barbershopId: number;
  barbershopName: string;
  barbershopAvatar: string | null;
  gender: 'male' | 'female' | 'other';
  isVip: boolean;
}

