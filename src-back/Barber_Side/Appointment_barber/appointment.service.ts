import prisma from '../../All_Utils/config/prisma';
import {
  GetAppointmentsRequest,
  GetAppointmentsResponse,
  UpdateAppointmentStatusRequest,
  UpdateAppointmentStatusResponse,
} from './appointment.type';

/**
 * Get appointments for barbershop
 */
export async function getAppointmentsService(
  barberId: number,
  data: GetAppointmentsRequest
): Promise<GetAppointmentsResponse> {
  try {
    // Get barbershop ID from barber
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    const barbershopId = barber.ownedBarbershops[0].id;
    const page = data.page || 1;
    const limit = data.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      barbershopId: barbershopId,
    };

    if (data.status && data.status !== 'all') {
      where.status = data.status;
    }

    // Get appointments
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    // Format appointments
    const formattedAppointments = appointments.map((app) => ({
      id: app.id,
      customerId: app.customerId,
      customerName: app.customer?.fullName || null,
      customerPhone: app.customer?.phone || '',
      customerAvatar: app.customer?.avatar || null,
      serviceId: app.serviceId,
      serviceName: app.service?.name || null,
      startTime: Number(app.startTime),
      endTime: Number(app.endTime),
      status: app.status as 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show',
      priceTotal: app.priceTotal ? Number(app.priceTotal) : null,
      paidAmount: app.paidAmount ? Number(app.paidAmount) : null,
      notes: app.notes,
      createdAt: Number(app.created),
    }));

    return {
      success: true,
      message: 'لیست نوبت‌ها با موفقیت دریافت شد',
      data: {
        appointments: formattedAppointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return {
      success: false,
      message: 'دریافت لیست نوبت‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Update appointment status (confirm/reject/pending)
 */
export async function updateAppointmentStatusService(
  barberId: number,
  appointmentId: number,
  data: UpdateAppointmentStatusRequest
): Promise<UpdateAppointmentStatusResponse> {
  try {
    // Get barbershop ID from barber
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        ownedBarbershops: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'نوبت یافت نشد',
      };
    }

    // Check if appointment belongs to this barbershop
    if (appointment.barbershopId !== barbershopId) {
      return {
        success: false,
        message: 'شما مجاز به تغییر وضعیت این نوبت نیستید',
      };
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled'],
      cancelled: ['pending'], // Allow re-opening cancelled appointments
    };

    const allowedStatuses = validTransitions[appointment.status] || [];
    if (!allowedStatuses.includes(data.status)) {
      return {
        success: false,
        message: `تغییر وضعیت از ${appointment.status} به ${data.status} مجاز نیست`,
      };
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: data.status as any,
        updated: BigInt(Date.now()),
      },
    });

    // Create appointment log
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        status: data.status as any,
        note: data.note || null,
        changedByType: 'barber',
        changedById: barberId,
        changedAt: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'وضعیت نوبت با موفقیت به‌روزرسانی شد',
      data: {
        appointmentId,
        status: data.status,
      },
    };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {
      success: false,
      message: 'به‌روزرسانی وضعیت نوبت با خطا مواجه شد',
    };
  }
}

