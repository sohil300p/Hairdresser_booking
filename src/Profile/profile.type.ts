// Profile Request/Response Types

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    profileImage: string | null;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
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
    profileImage: string | null;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  };
}

