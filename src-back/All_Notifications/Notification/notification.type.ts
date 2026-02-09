export interface RegisterTokenRequest {
  fcmToken: string;
  platform?: 'android' | 'ios' | 'web';
}

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
}

export type NotificationChannel = 'push' | 'email' | 'sms';

export interface SendNotificationRequest {
  userId: number;
  userType: 'customer' | 'barber';
  title: string;
  body: string;
  data?: Record<string, string>;
  /** When set, these channels are skipped (e.g. block email/SMS, only send push). */
  blockChannels?: NotificationChannel[];
}

export interface SendMulticastRequest {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

