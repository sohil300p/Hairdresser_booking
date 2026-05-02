import prisma from '../../All_Utils/config/prisma';
import type { CustomerInAppFilter, CustomerInAppNotificationItem } from './customer-inapp.type';

export async function listCustomerInAppNotifications(
  customerId: number,
  filter: CustomerInAppFilter
): Promise<{ success: boolean; message?: string; data?: { notifications: CustomerInAppNotificationItem[]; unreadCount: number } }> {
  try {
    const where: { customerId: number; read?: boolean } = { customerId };
    if (filter === 'read') where.read = true;
    if (filter === 'unread') where.read = false;

    const [rows, unreadCount] = await Promise.all([
      prisma.customerInAppNotification.findMany({
        where,
        orderBy: { created: 'desc' },
        take: 100,
      }),
      prisma.customerInAppNotification.count({ where: { customerId, read: false } }),
    ]);

    const notifications: CustomerInAppNotificationItem[] = rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      meta: (n.meta as Record<string, unknown>) ?? null,
      createdAt: Number(n.created),
    }));

    return { success: true, data: { notifications, unreadCount } };
  } catch (error) {
    console.error('List customer notifications error:', error);
    return { success: false, message: 'خطا در دریافت اعلان‌ها' };
  }
}

export async function markCustomerInAppNotificationRead(
  customerId: number,
  notificationId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.customerInAppNotification.updateMany({
      where: { id: notificationId, customerId },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error('Mark customer notification read error:', error);
    return { success: false, message: 'خطا در به‌روزرسانی' };
  }
}

export async function markAllCustomerInAppNotificationsRead(
  customerId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.customerInAppNotification.updateMany({
      where: { customerId },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error('Mark all customer notifications read error:', error);
    return { success: false, message: 'خطا در به‌روزرسانی' };
  }
}

export async function createCustomerInAppNotification(input: {
  customerId: number;
  type: string;
  title: string;
  body: string;
  meta?: Record<string, unknown> | null;
}): Promise<{ success: boolean; id?: number; message?: string }> {
  try {
    const now = BigInt(Date.now());
    const n = await prisma.customerInAppNotification.create({
      data: {
        customerId: input.customerId,
        type: input.type,
        title: input.title,
        body: input.body,
        meta: input.meta != null ? JSON.parse(JSON.stringify(input.meta)) : undefined,
        read: false,
        created: now,
      },
      select: { id: true },
    });
    return { success: true, id: n.id };
  } catch (error) {
    console.error('Create customer in-app notification error:', error);
    return { success: false, message: 'خطا در ایجاد اعلان' };
  }
}

