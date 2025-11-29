import api from './api';
import { 
  LoginWithPasswordRequest, 
  LoginResponse, 
  SendOtpRequest, 
  VerifyOtpRequest 
} from '../types/auth.types';

export const authService = {
  async loginWithPassword(data: LoginWithPasswordRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login/password', data);
    return response.data;
  },

  async sendOtp(data: SendOtpRequest): Promise<{ success: boolean; message: string; expiresIn?: number }> {
    const response = await api.post('/auth/send-otp', data);
    return response.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<LoginResponse> {
    // The backend endpoint for OTP login is /auth/login/otp or /otp/verify
    // Based on controller, it seems verifyOtpController handles login too
    const response = await api.post<LoginResponse>('/auth/login/otp', data);
    return response.data;
  },

  async getCurrentUser(): Promise<LoginResponse> {
    const response = await api.get<LoginResponse>('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
};

