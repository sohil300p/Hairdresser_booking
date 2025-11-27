// Barber Profile Edit Request/Response Types (PUT)

export interface EditBarberProfileRequest {
  name?: string;
  gender?: 'male' | 'female' | 'unisex';
  address?: string;
  description?: string;
}

export interface EditBarberProfileResponse {
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

