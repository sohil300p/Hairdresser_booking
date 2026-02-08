export type BarberNotificationType =
  | 'new_booking'
  | 'cancellation'
  | 'reminder'
  | 'promotion'
  | 'system';

export interface BarberNotificationItem {
  id: number;
  type: BarberNotificationType;
  title: string;
  body: string;
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

export interface ListBarberNotificationsResponse {
  success: boolean;
  message?: string;
  data?: {
    notifications: BarberNotificationItem[];
    unreadCount: number;
  };
}

export interface MarkReadBarberNotificationResponse {
  success: boolean;
  message?: string;
}

export interface CreateBarberInAppNotificationInput {
  barberId: number;
  type: BarberNotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}
