import prisma from '../../All_Utils/config/prisma';
import { GetTodayAppointmentsResponse } from './today-appointments.type';

/**
 * Get today's appointments for barber
 * Only appointments with status: 'confirmed' or 'pending'
 */
export async function getTodayAppointmentsService(
  barberId: number
): Promise<GetTodayAppointmentsResponse> {
  try {
    // Get today's date range (start and end of day)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfDayTimestamp = BigInt(startOfDay.getTime());
    const endOfDayTimestamp = BigInt(endOfDay.getTime());

    // Get today's appointments with status 'confirmed' or 'pending'
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: barberId,
        startTime: {
          gte: startOfDayTimestamp,
          lte: endOfDayTimestamp,
        },
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
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
        startTime: 'asc',
      },
    });

    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      customerId: appointment.customerId,
      customerName: appointment.customer.fullName,
      customerAvatar: appointment.customer.avatar,
      serviceId: appointment.serviceId,
      serviceName: appointment.service?.name || null,
      startTime: Number(appointment.startTime),
      endTime: Number(appointment.endTime),
      status: appointment.status as 'pending' | 'confirmed',
      priceTotal: appointment.priceTotal ? Number(appointment.priceTotal) : null,
      paidAmount: appointment.paidAmount ? Number(appointment.paidAmount) : null,
      notes: appointment.notes,
    }));

    return {
      success: true,
      message: 'نوبت‌های امروز با موفقیت دریافت شد',
      data: {
        appointments: formattedAppointments,
        total: formattedAppointments.length,
      },
    };
  } catch (error) {
    console.error('Error getting today appointments:', error);
    return {
      success: false,
      message: 'دریافت نوبت‌های امروز با خطا مواجه شد',
    };
  }
}


