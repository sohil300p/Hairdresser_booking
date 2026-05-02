import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import type { CustomerInAppFilter } from './customer-inapp.type';
import {
  listCustomerInAppNotifications,
  markAllCustomerInAppNotificationsRead,
  markCustomerInAppNotificationRead,
} from './customer-inapp.service';

export async function getCustomerInAppNotificationsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    if (req.user.userType !== 'customer') {
      res.status(403).json({ success: false, message: 'این API فقط برای مشتریان در دسترس است' });
      return;
    }

    const filter = (req.query.filter as CustomerInAppFilter) || 'all';
    const result = await listCustomerInAppNotifications(req.user.id, filter);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Get customer notifications error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function markCustomerInAppNotificationReadController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    if (req.user.userType !== 'customer') {
      res.status(403).json({ success: false, message: 'این API فقط برای مشتریان در دسترس است' });
      return;
    }

    const notificationId = parseInt(req.params.id, 10);
    if (Number.isNaN(notificationId)) {
      res.status(400).json({ success: false, message: 'شناسه اعلان نامعتبر است' });
      return;
    }

    const result = await markCustomerInAppNotificationRead(req.user.id, notificationId);
    res.json(result);
  } catch (error) {
    console.error('Mark customer notification read error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function markAllCustomerInAppNotificationsReadController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    if (req.user.userType !== 'customer') {
      res.status(403).json({ success: false, message: 'این API فقط برای مشتریان در دسترس است' });
      return;
    }

    const result = await markAllCustomerInAppNotificationsRead(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Mark all customer notifications read error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

