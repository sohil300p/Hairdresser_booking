import api from './api';

export interface User {
  id: number;
  fullName: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  gender: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  appointmentCount: number;
}

export interface OtpStatus {
  success: boolean;
  attempts?: number;
  remaining?: number;
  isBlocked?: boolean;
  message?: string;
}

export const usersService = {
  getAllUsers: async () => {
    try {
      const response = await api.get<{ success: boolean; users: User[] }>('/admin/users');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need admin privileges to view users.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch users. Please check your connection.');
      }
    }
  },

  resetOtpLimit: async (phone: string) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/admin/users/${phone}/reset-otp`, {});
      return response.data;
    } catch (error: any) {
      console.error('Failed to reset OTP limit:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to reset OTP limit.');
      }
    }
  },

  getOtpStatus: async (phone: string): Promise<OtpStatus> => {
    try {
      const response = await api.get<OtpStatus>(`/admin/users/${phone}/otp-status`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get OTP status:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to get OTP status.');
      }
    }
  },
};

