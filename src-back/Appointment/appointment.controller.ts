import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import {
  createAppointmentService,
  getAppointmentService,
  listAppointmentsService,
  updateAppointmentStatusService,
  cancelAppointmentService,
  rescheduleAppointmentService,
} from './appointment.service';
import {
  CreateAppointmentRequest,
  ListAppointmentsRequest,
  UpdateAppointmentStatusRequest,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from './appointment.type';
import { checkAvailabilityService } from './availability.service';
import { CheckAvailabilityRequest } from './appointment.type';

/**
 * Check Availability Controller
 * GET /api/appointments/availability
 */
export async function checkAvailabilityController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data: CheckAvailabilityRequest = {
      barberId: req.query.barberId ? parseInt(req.query.barberId as string) : undefined,
      barbershopId: req.query.barbershopId ? parseInt(req.query.barbershopId as string) : undefined,
      date: req.query.date as string,
      serviceId: req.query.serviceId ? parseInt(req.query.serviceId as string) : undefined,
    };

    if (!data.date) {
      res.status(400).json({
        success: false,
        message: 'تاریخ الزامی است',
      });
      return;
    }

    const result = await checkAvailabilityService(data);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in checkAvailabilityController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Create Appointment Controller
 * POST /api/appointments
 */
export async function createAppointmentController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const data: CreateAppointmentRequest = req.body;

    if (!data.date || !data.time || !data.serviceId || !data.paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'تاریخ، ساعت، سرویس و روش پرداخت الزامی است',
      });
      return;
    }

    const result = await createAppointmentService(data, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createAppointmentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get Appointment Controller
 * GET /api/appointments/:id
 */
export async function getAppointmentController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه رزرو معتبر نیست',
      });
      return;
    }

    const result = await getAppointmentService(
      appointmentId,
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getAppointmentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * List Appointments Controller
 * GET /api/appointments
 */
export async function listAppointmentsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const data: ListAppointmentsRequest = {
      customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
      barberId: req.query.barberId ? parseInt(req.query.barberId as string) : undefined,
      barbershopId: req.query.barbershopId ? parseInt(req.query.barbershopId as string) : undefined,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await listAppointmentsService(
      data,
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in listAppointmentsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Update Appointment Status Controller
 * PUT /api/appointments/:id/status
 */
export async function updateAppointmentStatusController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه رزرو معتبر نیست',
      });
      return;
    }

    const data: UpdateAppointmentStatusRequest = req.body;

    if (!data.status) {
      res.status(400).json({
        success: false,
        message: 'وضعیت الزامی است',
      });
      return;
    }

    const result = await updateAppointmentStatusService(
      appointmentId,
      data,
      req.user.id,
      req.user.userType || 'customer'
    );

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

/**
 * Cancel Appointment Controller
 * POST /api/appointments/:id/cancel
 */
export async function cancelAppointmentController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه رزرو معتبر نیست',
      });
      return;
    }

    const data: CancelAppointmentRequest = req.body;

    const result = await cancelAppointmentService(
      appointmentId,
      data,
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in cancelAppointmentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Reschedule Appointment Controller
 * POST /api/appointments/:id/reschedule
 */
export async function rescheduleAppointmentController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه رزرو معتبر نیست',
      });
      return;
    }

    const data: RescheduleAppointmentRequest = req.body;

    if (!data.date || !data.time) {
      res.status(400).json({
        success: false,
        message: 'تاریخ و ساعت جدید الزامی است',
      });
      return;
    }

    const result = await rescheduleAppointmentService(
      appointmentId,
      data,
      req.user.id,
      req.user.userType || 'customer'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in rescheduleAppointmentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

