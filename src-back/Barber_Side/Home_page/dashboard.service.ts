import prisma from '../../All_Utils/config/prisma';
import { GetDashboardResponse } from './dashboard.type';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get dashboard data for barber
 */
export async function getDashboardService(
  barberId: number
): Promise<GetDashboardResponse> {
  try {
    // Get barber with barbershop info
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        fullName: true,
        ownedBarbershops: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
          take: 1,
        },
      },
    });

    if (!barber) {
      return {
        success: false,
        message: 'آرایشگر یافت نشد',
      };
    }

    const barbershop = barber.ownedBarbershops[0];
    if (!barbershop) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    const barbershopId = barbershop.id;

    // Get total unique customers
    const uniqueCustomers = await prisma.appointment.findMany({
      where: {
        barberId: barberId,
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    });
    const totalCustomers = uniqueCustomers.length;

    // Get active reservations (not cancelled, not completed, not no_show)
    const activeReservations = await prisma.appointment.count({
      where: {
        barberId: barberId,
        status: {
          notIn: ['cancelled', 'completed', 'no_show'],
        },
      },
    });

    // Calculate weekly revenue (current week: Sunday to Saturday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    // Get Sunday of current week (week starts from Sunday)
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    const startOfWeekTimestamp = BigInt(startOfWeek.getTime());

    // Get end of week (Saturday 23:59:59)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const endOfWeekTimestamp = BigInt(endOfWeek.getTime());

    // Get all appointments with payments in current week
    const appointmentsWithPayments = await prisma.appointment.findMany({
      where: {
        barberId: barberId,
        startTime: {
          gte: startOfWeekTimestamp,
          lte: endOfWeekTimestamp,
        },
      },
      include: {
        payments: {
          where: {
            paidAt: {
              not: null,
            },
          },
          select: {
            amount: true,
            paidAt: true,
          },
        },
      },
    });

    // Initialize weekly revenue
    const weeklyRevenue = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
    };

    // Calculate revenue per day
    for (const appointment of appointmentsWithPayments) {
      if (appointment.payments.length === 0) continue;

      const startTimeDate = new Date(Number(appointment.startTime));
      const dayOfWeek = startTimeDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Sum all payments for this appointment
      const totalPayment = appointment.payments.reduce((sum, payment) => {
        return sum.plus(payment.amount);
      }, new Decimal(0));

      const revenueAmount = Number(totalPayment);

      // Add to corresponding day
      switch (dayOfWeek) {
        case 0: // Sunday
          weeklyRevenue.sunday += revenueAmount;
          break;
        case 1: // Monday
          weeklyRevenue.monday += revenueAmount;
          break;
        case 2: // Tuesday
          weeklyRevenue.tuesday += revenueAmount;
          break;
        case 3: // Wednesday
          weeklyRevenue.wednesday += revenueAmount;
          break;
        case 4: // Thursday
          weeklyRevenue.thursday += revenueAmount;
          break;
        case 5: // Friday
          weeklyRevenue.friday += revenueAmount;
          break;
        case 6: // Saturday
          weeklyRevenue.saturday += revenueAmount;
          break;
      }
    }

    return {
      success: true,
      message: 'اطلاعات داشبورد با موفقیت دریافت شد',
      data: {
        barberName: barber.fullName,
        barbershopName: barbershop.name,
        barbershopProfileImage: barbershop.avatar,
        totalCustomers,
        activeReservations,
        weeklyRevenue,
      },
    };
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return {
      success: false,
      message: 'دریافت اطلاعات داشبورد با خطا مواجه شد',
    };
  }
}

