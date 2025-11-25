// Authentication Request/Response Types

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    phone: string;
    role: 'customer' | 'admin' | 'staff_admin';
    userType?: 'customer' | 'barber';
    barberId?: number;
  };
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}
