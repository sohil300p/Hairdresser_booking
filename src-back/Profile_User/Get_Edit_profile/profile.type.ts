// Profile Request/Response Types

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    email: string | null;
    profileImage: string | null;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
    gender?: 'male' | 'female' | 'other' | null;
    userType?: 'customer' | 'barber';
    barberId?: number;
    createdAt: number;
    updatedAt: number;
  };
}

export interface EditProfileRequest {
  firstName?: string;
  lastName?: string ;
  profileImage?: string;
}

export interface EditProfileResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    email: string | null;
    profileImage: string | null;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
    gender?: 'male' | 'female' | 'other' | null;
    userType?: 'customer' | 'barber';
    barberId?: number;
    createdAt: number;
    updatedAt: number;
  };
}

