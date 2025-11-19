import prisma from '../config/prisma';
import { GetMyReservationsResponse, ReservationItem } from './my-reservations.type';

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  paid: 'پرداخت شده',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
  no_show: 'عدم حضور',
};

export async function getMyReservationsService(
  customerId: number
): Promise<GetMyReservationsResponse> {
  try {
    const now = BigInt(Date.now());

    const appointments = await prisma.appointment.findMany({
      where: {
        customerId,
      },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        barber: {
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
        startTime: 'desc',
      },
    });

    const future: ReservationItem[] = [];
    const past: ReservationItem[] = [];
    const cancelled: ReservationItem[] = [];

    for (const apt of appointments) {
      const reservationItem: ReservationItem = {
        id: apt.id,
        barbershopName: apt.barbershop?.name || 'نامشخص',
        barbershopAvatar: apt.barbershop?.avatar || null,
        barberName: apt.barber?.fullName || null,
        barberAvatar: apt.barber?.avatar || null,
        serviceType: apt.serviceType || apt.service?.name || null,
        price: apt.priceTotal ? Number(apt.priceTotal) : null,
        date: Number(apt.startTime),
        status: apt.status,
        statusLabel: STATUS_LABELS[apt.status] || apt.status,
      };

      if (apt.status === 'cancelled') {
        cancelled.push(reservationItem);
      } else if (apt.status === 'completed') {
        past.push(reservationItem);
      } else if (apt.status === 'confirmed' || apt.status === 'paid') {
        if (apt.startTime > now) {
          future.push(reservationItem);
        } else {
          past.push(reservationItem);
        }
      } else if (apt.startTime < now) {
        past.push(reservationItem);
      } else {
        future.push(reservationItem);
      }
    }

    return {
      success: true,
      message: 'رزروهای شما با موفقیت دریافت شد',
      data: {
        future,
        past,
        cancelled,
      },
    };
  } catch (error) {
    console.error('Error getting my reservations:', error);
    return {
      success: false,
      message: 'دریافت رزروها با خطا مواجه شد',
    };
  }
}

