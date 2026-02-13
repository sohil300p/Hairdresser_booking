import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import {
  getAppointmentsService,
  updateAppointmentStatusService,
} from './appointment.service';
import {
  GetAppointmentsRequest,
  UpdateAppointmentStatusRequest,
} from './appointment.type';

/**
 * Get appointments for barbershop
 * GET /api/barber/appointments
 */
export async function getAppointmentsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const barberId = req.user.barberId;

    const requestData: GetAppointmentsRequest = {
      status: req.query.status as any || 'all',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show', 'all'];
    if (requestData.status && !validStatuses.includes(requestData.status)) {
      res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است',
      });
      return;
    }

    const result = await getAppointmentsService(barberId, requestData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getAppointmentsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Update appointment status
 * PUT /api/barber/appointments/:id/status
 */
export async function updateAppointmentStatusController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const appointmentId = parseInt(req.params.id);
    if (isNaN(appointmentId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه نوبت نامعتبر است',
      });
      return;
    }

    const barberId = req.user.barberId;

    const requestData: UpdateAppointmentStatusRequest = {
      status: req.body.status,
      note: req.body.note,
    };

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!requestData.status || !validStatuses.includes(requestData.status)) {
      res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است. وضعیت باید یکی از pending، confirmed یا cancelled باشد',
      });
      return;
    }

    const result = await updateAppointmentStatusService(barberId, appointmentId, requestData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateAppointmentStatusController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}


