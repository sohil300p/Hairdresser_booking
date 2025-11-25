import { Request, Response } from 'express';
import { getBarbershopDetailsService } from './barbershop-details.service';
import { GetBarbershopDetailsRequest } from './barbershop-details.type';

/**
 * Get barbershop details controller
 * GET /api/barbershop/:id/details
 */
export async function getBarbershopDetailsController(
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

    const params: GetBarbershopDetailsRequest = {
      barbershopId,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await getBarbershopDetailsService(params);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarbershopDetailsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

