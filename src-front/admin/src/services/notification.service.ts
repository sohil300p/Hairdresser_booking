import api from './api';

export interface NotificationUser {
  userId: number;
  userType: 'customer' | 'barber';
  name: string;
  phone: string;
  platform: string;
  lastActive: string | null;
}

export type NotificationChannel = 'push' | 'email' | 'sms';

export interface SendNotificationData {
  userId: number;
  userType: 'customer' | 'barber';
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Channels to skip (e.g. block email/SMS, only send push). */
  blockChannels?: NotificationChannel[];
}

export const notificationService = {
  getUsersWithDevices: async () => {
    try {
      const response = await api.get<{ success: boolean; users: NotificationUser[] }>('/admin/notifications/users');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch users with devices:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users with devices');
    }
  },

  sendNotification: async (data: SendNotificationData) => {
    try {
      const response = await api.post<{ success: boolean; message?: string; sentCount?: number; failureCount?: number }>('/admin/notifications/send', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send notification');
    }
  },
};

