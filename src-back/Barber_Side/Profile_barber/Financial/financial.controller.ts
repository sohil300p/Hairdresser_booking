import { Response } from 'express';
import { AuthRequest } from '../../../../User_Side/auth/auth.middleware';
import { ensureBarberRecord } from '../utils/barber.utils';
import { getBarberFinancialConfigService } from './financial.service';

export async function getBarberFinancialConfigController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const barberId = await ensureBarberRecord(req.user!.id);
    const result = await getBarberFinancialConfigService(barberId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Get barber financial config error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}
