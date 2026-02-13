import prisma from '../../All_Utils/config/prisma';
import { getRedisClient, isRedisConnected } from '../../All_Utils/config/redis';
import type {
  BarberNotificationItem,
  BarberNotificationType,
  CreateBarberInAppNotificationInput,
} from './barber-notifications.type';

const REDIS_CHANNEL_PREFIX = 'barber:notifications:';

export async function listBarberNotifications(
  barberId: number,
  filter: 'all' | 'unread' | 'read'
): Promise<{ success: boolean; message?: string; data?: { notifications: BarberNotificationItem[]; unreadCount: number } }> {
  try {
    const where: { barberId: number; read?: boolean } = { barberId };
    if (filter === 'read') where.read = true;
    if (filter === 'unread') where.read = false;

    const [notifications, unreadResult] = await Promise.all([
      prisma.barberInAppNotification.findMany({
        where,
        orderBy: { created: 'desc' },
        take: 100,
      }),
      prisma.barberInAppNotification.count({ where: { barberId, read: false } }),
    ]);

    const items: BarberNotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type as BarberNotificationType,
      title: n.title,
      body: n.body,
      read: n.read,
      meta: (n.meta as Record<string, unknown>) ?? null,
      createdAt: Number(n.created),
    }));

    return {
      success: true,
      data: { notifications: items, unreadCount: unreadResult },
    };
  } catch (error) {
    console.error('List barber notifications error:', error);
    return { success: false, message: 'خطا در دریافت اعلان‌ها' };
  }
}

export async function markBarberNotificationRead(
  barberId: number,
  notificationId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.barberInAppNotification.updateMany({
      where: { id: notificationId, barberId },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error('Mark barber notification read error:', error);
    return { success: false, message: 'خطا در به‌روزرسانی' };
  }
}

export async function markAllBarberNotificationsRead(
  barberId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.barberInAppNotification.updateMany({
      where: { barberId },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error('Mark all barber notifications read error:', error);
    return { success: false, message: 'خطا در به‌روزرسانی' };
  }
}

export async function createBarberInAppNotification(
  input: CreateBarberInAppNotificationInput
): Promise<{ success: boolean; id?: number; message?: string }> {
  try {
    const now = BigInt(Date.now());
    const n = await prisma.barberInAppNotification.create({
      data: {
        barberId: input.barberId,
        type: input.type,
        title: input.title,
        body: input.body,
        meta: input.meta != null ? JSON.parse(JSON.stringify(input.meta)) : undefined,
        read: false,
        created: now,
      },
      select: { id: true, barberId: true, type: true, title: true, body: true, read: true, meta: true, created: true },
    });

    try {
      if (isRedisConnected()) {
        const client = getRedisClient();
        const channel = `${REDIS_CHANNEL_PREFIX}${input.barberId}`;
        await client.publish(
          channel,
          JSON.stringify({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            read: n.read,
            meta: n.meta,
            createdAt: Number(n.created),
          })
        );
      }
    } catch (redisErr) {
      console.warn('Redis publish barber notification:', redisErr);
    }

    return { success: true, id: n.id };
  } catch (error) {
    console.error('Create barber in-app notification error:', error);
    return { success: false, message: 'خطا در ایجاد اعلان' };
  }
}
