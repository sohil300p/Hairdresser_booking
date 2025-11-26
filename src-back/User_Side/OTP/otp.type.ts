// OTP Request/Response Types

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // OTP expiration time in seconds
  remainingAttempts?: number; // Remaining OTP attempts for today
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  userType?: 'customer' | 'barber';
  gender?: 'male' | 'female';
  fullName?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    phone: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
    userType?: 'customer' | 'barber';
    barberId?: number;
  };
  isNewUser?: boolean;
}

