import { Request, Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { ensureBarberRecord } from '../utils/barber.utils';
import {
  getReservationRulesService,
  putReservationRulesService,
} from './reservation-rules.service';
import type { PutReservationRulesRequest } from './reservation-rules.type';

export async function getReservationRulesController(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'کاربر احراز هویت نشده است' });
      return;
    }

    const barberId = await ensureBarberRecord(req.user.id);
    const result = await getReservationRulesService(barberId);

    if (result.success && result.data) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(404).json({ success: false, message: result.message ?? 'یافت نشد' });
    }
  } catch (error) {
    console.error('getReservationRules error:', error);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
  }
}

export async function putReservationRulesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'کاربر احراز هویت نشده است' });
      return;
    }

    const barberId = await ensureBarberRecord(authReq.user.id);
    const body = req.body as PutReservationRulesRequest;
    const result = await putReservationRulesService(barberId, body);

    if (result.success && result.data) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.message ?? 'خطا در ذخیره' });
    }
  } catch (error) {
    console.error('putReservationRules error:', error);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
  }
}
