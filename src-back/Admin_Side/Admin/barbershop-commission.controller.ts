import { Request, Response } from 'express';
import prisma from '../../All_Utils/config/prisma';
import { authenticateAdmin } from './admin-auth.middleware';

export async function setBarbershopCommissionController(req: Request, res: Response): Promise<void> {
  try {
    const shopId = parseInt(req.params.id, 10);
    if (Number.isNaN(shopId)) {
      res.status(400).json({ success: false, message: 'شناسه آرایشگاه نامعتبر است' });
      return;
    }
    const { platformCommissionPercent } = req.body as { platformCommissionPercent?: number };
    if (platformCommissionPercent === undefined || platformCommissionPercent === null) {
      res.status(400).json({ success: false, message: 'platformCommissionPercent الزامی است' });
      return;
    }
    const percent = Number(platformCommissionPercent);
    if (percent < 0 || percent > 100) {
      res.status(400).json({ success: false, message: 'درصد کمیسیون باید بین ۰ تا ۱۰۰ باشد' });
      return;
    }

    await prisma.barbershop.update({
      where: { id: shopId },
      data: { platformCommissionPercent: percent },
    });

    res.json({ success: true, message: 'کمیسیون پلتفرم با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Set barbershop commission error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}
