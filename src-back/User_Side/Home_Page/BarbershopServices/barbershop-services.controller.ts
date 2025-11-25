import { Request, Response } from 'express';
import { getBarbershopServicesService } from './barbershop-services.service';

/**
 * Get barbershop services controller
 * GET /api/barbershop/:id/services
 */
export async function getBarbershopServicesController(
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

    const result = await getBarbershopServicesService({ barbershopId });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarbershopServicesController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

