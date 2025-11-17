// Login Request/Response Types

export interface LoginWithPasswordRequest {
  phone: string;
  password: string;
}

export interface LoginWithOtpRequest {
  phone: string;
  otp: string;
  userType?: 'customer' | 'barber'; // required on first registration
  gender?: 'male' | 'female' | 'other'; // required on first registration
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    phone: string;
    fullName?: string | null;
    email?: string | null;
    avatar?: string | null;
    role: 'customer' | 'admin' | 'staff_admin';
    userType: 'customer' | 'barber';
    barberId?: number; // if userType is barber
    gender?: 'male' | 'female' | 'other' | null;
  };
  isNewUser?: boolean;
}

