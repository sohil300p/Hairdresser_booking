import api from './api';

export interface Staff {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  role: 'admin' | 'staff_admin';
  isActive: boolean;
  permissions: any;
  createdAt: string;
  lastLoginAt: string | null;
}

export const staffService = {
  getAllStaff: async () => {
    try {
      const response = await api.get<{ success: boolean; admins: Staff[] }>('/admin/staff');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need full admin privileges to view staff.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch staff. Please check your connection.');
      }
    }
  },
};

