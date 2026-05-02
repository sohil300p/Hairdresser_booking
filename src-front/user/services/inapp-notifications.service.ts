import { api } from '../utils/api';

export type InAppFilter = 'all' | 'unread' | 'read';

export interface InAppNotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

export async function getInAppNotifications(filter: InAppFilter = 'all'): Promise<{
  notifications: InAppNotificationItem[];
  unreadCount: number;
}> {
  const res = await api.get<{ success: boolean; data?: { notifications: InAppNotificationItem[]; unreadCount: number } }>(
    `/notifications/in-app?filter=${filter}`
  );
  if (!res.success || !res.data) return { notifications: [], unreadCount: 0 };
  return res.data;
}

export async function markInAppNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/in-app/${id}/read`, {});
}

export async function markAllInAppNotificationsRead(): Promise<void> {
  await api.patch(`/notifications/in-app/read-all`, {});
}

