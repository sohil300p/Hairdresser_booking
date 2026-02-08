import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import { ensureBarberRecord } from '../Profile_barber/utils/barber.utils';
import {
  listBarberNotifications,
  markBarberNotificationRead,
  markAllBarberNotificationsRead,
} from './barber-notifications.service';

export async function getBarberNotificationsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const barberId = await ensureBarberRecord(req.user!.id);
    const filter = (req.query.filter as 'all' | 'unread' | 'read') || 'all';
    const result = await listBarberNotifications(barberId, filter);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Get barber notifications error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function markBarberNotificationReadController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const barberId = await ensureBarberRecord(req.user!.id);
    const notificationId = parseInt(req.params.id, 10);
    if (Number.isNaN(notificationId)) {
      res.status(400).json({ success: false, message: 'شناسه اعلان نامعتبر است' });
      return;
    }
    const result = await markBarberNotificationRead(barberId, notificationId);
    res.json(result);
  } catch (error) {
    console.error('Mark barber notification read error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function markAllBarberNotificationsReadController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const barberId = await ensureBarberRecord(req.user!.id);
    const result = await markAllBarberNotificationsRead(barberId);
    res.json(result);
  } catch (error) {
    console.error('Mark all barber notifications read error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}
