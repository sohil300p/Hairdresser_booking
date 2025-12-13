export interface RegisterTokenRequest {
  fcmToken: string;
  platform?: 'android' | 'ios' | 'web';
}

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
}

export interface SendNotificationRequest {
  userId: number;
  userType: 'customer' | 'barber';
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendMulticastRequest {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

