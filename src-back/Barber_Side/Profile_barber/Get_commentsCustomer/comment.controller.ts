import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getCommentsService } from './comment.service';
import prisma from '../../../All_Utils/config/prisma';
import { ensureBarberRecord } from '../utils/barber.utils';

/**
 * Get Comments Controller
 * GET /api/barber/comments
 */
export async function getCommentsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;
    const result = await getCommentsService(barbershopId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getCommentsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

