import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getWorkingHoursService, createWorkingHoursService, editWorkingHoursService } from './workinghour.service';
import { CreateWorkingHoursRequest, EditWorkingHoursRequest } from './workinghour.type';
import prisma from '../../../All_Utils/config/prisma';
import { ensureBarberRecord } from '../utils/barber.utils';

/**
 * Get Working Hours Controller
 * GET /api/barber/working-hours
 */
export async function getWorkingHoursController(req: AuthRequest, res: Response): Promise<void> {
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
    const result = await getWorkingHoursService(barbershopId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getWorkingHoursController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Create Working Hours Controller
 * POST /api/barber/working-hours
 */
export async function createWorkingHoursController(req: AuthRequest, res: Response): Promise<void> {
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

    // Parse schedules from request body
    let schedules: any[];
    try {
      schedules = typeof req.body.schedules === 'string' ? JSON.parse(req.body.schedules) : req.body.schedules;
    } catch {
      schedules = req.body.schedules || [];
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      res.status(400).json({
        success: false,
        message: 'لیست ساعات کاری باید یک آرایه باشد',
      });
      return;
    }

    const createData: CreateWorkingHoursRequest = {
      schedules: schedules.map((s) => ({
        weekday: parseInt(s.weekday),
        openTime: s.openTime,
        closeTime: s.closeTime,
        isClosed: s.isClosed || false,
      })),
    };

    const result = await createWorkingHoursService(barbershopId, createData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createWorkingHoursController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Edit Working Hours Controller
 * PUT /api/barber/working-hours
 */
export async function editWorkingHoursController(req: AuthRequest, res: Response): Promise<void> {
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

    // Parse schedules from request body
    let schedules: any[];
    try {
      schedules = typeof req.body.schedules === 'string' ? JSON.parse(req.body.schedules) : req.body.schedules;
    } catch {
      schedules = req.body.schedules || [];
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      res.status(400).json({
        success: false,
        message: 'لیست ساعات کاری باید یک آرایه باشد',
      });
      return;
    }

    const editData: EditWorkingHoursRequest = {
      schedules: schedules.map((s) => ({
        weekday: parseInt(s.weekday),
        openTime: s.openTime,
        closeTime: s.closeTime,
        isClosed: s.isClosed,
      })),
    };

    const result = await editWorkingHoursService(barbershopId, editData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in editWorkingHoursController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

