export interface User {
  id: number;
  phone: string;
  fullName: string | null;
  email?: string | null;
  avatar?: string | null;
  role: 'customer' | 'admin' | 'staff_admin';
  userType: 'customer' | 'barber';
  barberId?: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: User;
  isNewUser?: boolean;
}

export interface LoginWithPasswordRequest {
  phone: string;
  password?: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

