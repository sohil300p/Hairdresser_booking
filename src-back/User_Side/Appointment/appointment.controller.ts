import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import {
  createAppointmentService,
  getAppointmentService,
  getAppointmentByPublicRefService,
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

function toYmdLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get earliest bookable date (no auth)
 * GET /api/appointments/start-date?barberId&barbershopId&serviceId
 */
export async function getBookingStartDateController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const barberId = req.query.barberId ? parseInt(req.query.barberId as string, 10) : undefined;
    const barbershopId = req.query.barbershopId ? parseInt(req.query.barbershopId as string, 10) : undefined;
    const serviceId = req.query.serviceId ? parseInt(req.query.serviceId as string, 10) : undefined;

    if (!barberId && !barbershopId) {
      res.status(400).json({ success: false, message: 'شناسه آرایشگر یا آرایشگاه الزامی است' });
      return;
    }
    if (!serviceId) {
      res.status(400).json({ success: false, message: 'شناسه سرویس الزامی است' });
      return;
    }

    const base = new Date();
    base.setHours(0, 0, 0, 0);

    for (let i = 0; i < 31; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const ymd = toYmdLocal(d);
      const availability = await checkAvailabilityService({
        barberId,
        barbershopId,
        serviceId,
        date: ymd,
      });
      const hasAny = availability.success && (availability.availableSlots ?? []).some((s) => s.available);
      if (hasAny) {
        res.status(200).json({ success: true, message: 'OK', startDate: ymd });
        return;
      }
    }

    res.status(200).json({ success: true, message: 'OK', startDate: toYmdLocal(base) });
  } catch (error) {
    console.error('Error in getBookingStartDateController:', error);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
  }
}

/**
 * Get Appointment by public reference (no auth)
 * GET /api/appointments/ref/:ref
 */
export async function getAppointmentByPublicRefController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ref = (req.params.ref as string) || '';
    const result = await getAppointmentByPublicRefService(ref);
    if (result.success) res.status(200).json(result);
    else res.status(404).json(result);
  } catch (error) {
    console.error('Error in getAppointmentByPublicRefController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

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

