import { Request, Response } from 'express';
import { getBarbershopOverviewService } from './barbershop-overview.service';
import { GetBarbershopOverviewRequest } from './barbershop-overview.type';

/**
 * Get barbershop overview controller
 * GET /api/barbershop/:id/overview
 */
export async function getBarbershopOverviewController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const barbershopId = parseInt(req.params.id, 10);

    if (isNaN(barbershopId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه آرایشگاه نامعتبر است',
      });
      return;
    }

    const params: GetBarbershopOverviewRequest = {
      barbershopId,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
    };

    const result = await getBarbershopOverviewService(params);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarbershopOverviewController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

