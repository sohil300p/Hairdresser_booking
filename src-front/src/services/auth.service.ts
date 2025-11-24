import api from './api';
import { tokenService } from './token.service';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  remainingAttempts?: number;
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
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    phone: string;
    role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
  };
}

export const authService = {
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    // Sanitize phone: trim and ensure it's a string
    const sanitizedPhone = String(phone).trim();
    const response = await api.post<SendOtpResponse>('/otp/send', { phone: sanitizedPhone });
    return response.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    // Sanitize inputs: trim and ensure they're strings
    const sanitizedPhone = String(phone).trim();
    const sanitizedOtp = String(otp).trim();
    
    // Validate OTP format (should be exactly 4 digits)
    if (!/^\d{4}$/.test(sanitizedOtp)) {
      throw new Error('کد OTP باید دقیقاً ۴ رقم باشد');
    }
    
    const response = await api.post<VerifyOtpResponse>('/otp/verify', { 
      phone: sanitizedPhone, 
      otp: sanitizedOtp 
    });
    if (response.data.success && response.data.token && response.data.refreshToken) {
      tokenService.setTokens(response.data.token, response.data.refreshToken);
    }
    return response.data;
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', {
      refreshToken,
    });
    if (response.data.success && response.data.token && response.data.refreshToken) {
      tokenService.setTokens(response.data.token, response.data.refreshToken);
    }
    return response.data;
  },

  async verifyToken(): Promise<VerifyTokenResponse> {
    const token = tokenService.getAccessToken();
    if (!token) {
      throw new Error('No token available');
    }
    const response = await api.post<VerifyTokenResponse>('/auth/verify-token', { token });
    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    tokenService.clearTokens();
  },
};

