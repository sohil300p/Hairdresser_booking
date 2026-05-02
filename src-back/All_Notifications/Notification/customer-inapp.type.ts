export type CustomerInAppFilter = 'all' | 'unread' | 'read';

export interface CustomerInAppNotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

