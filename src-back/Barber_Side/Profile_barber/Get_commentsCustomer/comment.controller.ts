import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getCommentsService } from './comment.service';
import prisma from '../../../All_Utils/config/prisma';

/**
 * Get Comments Controller
 * GET /api/barber/comments
 */
export async function getCommentsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const barber = await prisma.barber.findUnique({
      where: { id: req.user.barberId },
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

