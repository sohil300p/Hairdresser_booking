import { Request, Response } from 'express';
import { getBarbersService, getBarberByIdService } from './barber.service';
import { GetBarbersRequest } from './barber.type';

/**
 * Get all barbers controller
 * GET /api/barbers
 */
export async function getBarbersController(req: Request, res: Response): Promise<void> {
  try {
    const params: GetBarbersRequest = {
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
    };

    const result = await getBarbersService(params);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarbersController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get single barber by ID controller
 * GET /api/barbers/:id
 */
export async function getBarberByIdController(req: Request, res: Response): Promise<void> {
  try {
    const barberId = parseInt(req.params.id, 10);

    if (isNaN(barberId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه آرایشگر نامعتبر است',
      });
      return;
    }

    const result = await getBarberByIdService(barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarberByIdController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

