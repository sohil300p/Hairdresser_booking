// Barber Profile Request/Response Types (GET & POST)

export interface GetBarberProfileResponse {
  success: boolean;
  message: string;
  data?: {
    barbershop: {
      id: number;
      name: string;
      gender: 'male' | 'female' | 'unisex';
      address: string | null;
      description: string | null;
      profileImage: string | null;
      backgroundImage: string | null;
    };
    services: Array<{
      id: number;
      name: string;
      description: string | null;
      price: number | null;
      estimatedTime: number; // minutes
      images: string[];
      avatar: string | null;
    }>;
    schedules: Array<{
      weekday: number; // 0-6 (Sunday-Saturday)
      openTime: string; // HH:mm format
      closeTime: string; // HH:mm format
      isClosed: boolean;
    }>;
  };
}

export interface CreateBarberProfileRequest {
  name: string;
  gender: 'male' | 'female' | 'unisex';
  address?: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateBarberProfileResponse {
  success: boolean;
  message: string;
  data?: {
    barbershop: {
      id: number;
      name: string;
      gender: 'male' | 'female' | 'unisex';
      address: string | null;
      description: string | null;
      profileImage: string | null;
      backgroundImage: string | null;
    };
  };
}
