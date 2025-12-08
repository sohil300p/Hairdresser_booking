import prisma from '../../All_Utils/config/prisma';
import { GetCustomersResponse } from './customers.type';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get all customers of barbershop with visit count
 */
export async function getCustomersService(
  barberId: number
): Promise<GetCustomersResponse> {
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

    // Get all unique customers who have appointments with this barbershop
    const appointments = await prisma.appointment.findMany({
      where: {
        barbershopId: barbershopId,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            avatar: true,
            gender: true,
            createdAt: true,
            lastLoginAt: true,
            publicMeta: true,
            privateMeta: true,
          },
        },
        payments: {
          where: {
            paidAt: {
              not: null,
            },
          },
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Group appointments by customer and calculate statistics
    const customerMap = new Map<
      number,
      {
        customer: {
          id: number;
          fullName: string | null;
          phone: string;
          email: string | null;
          avatar: string | null;
          gender: 'male' | 'female' | 'other' | null;
          createdAt: Date;
          lastLoginAt: Date | null;
          publicMeta: any;
          privateMeta: any;
        };
        visitCount: number;
        lastVisitDate: number | null;
        totalSpent: Decimal;
        appointments: Array<{
          startTime: bigint;
          payments: Array<{ amount: Decimal }>;
        }>;
      }
    >();

    for (const appointment of appointments) {
      const customerId = appointment.customerId;
      const existing = customerMap.get(customerId);

      if (!existing) {
        // First time seeing this customer
        const totalSpent = appointment.payments.reduce(
          (sum, payment) => sum.plus(payment.amount),
          new Decimal(0)
        );

        customerMap.set(customerId, {
          customer: appointment.customer,
          visitCount: 1,
          lastVisitDate: Number(appointment.startTime),
          totalSpent,
          appointments: [
            {
              startTime: appointment.startTime,
              payments: appointment.payments,
            },
          ],
        });
      } else {
        // Update existing customer
        existing.visitCount += 1;
        
        // Update last visit date if this appointment is more recent
        const appointmentTime = Number(appointment.startTime);
        if (!existing.lastVisitDate || appointmentTime > existing.lastVisitDate) {
          existing.lastVisitDate = appointmentTime;
        }

        // Add to total spent
        const appointmentTotal = appointment.payments.reduce(
          (sum, payment) => sum.plus(payment.amount),
          new Decimal(0)
        );
        existing.totalSpent = existing.totalSpent.plus(appointmentTotal);

        existing.appointments.push({
          startTime: appointment.startTime,
          payments: appointment.payments,
        });
      }
    }

    // Convert map to array and format response
    const customers = Array.from(customerMap.values()).map((item) => {
      return {
        id: item.customer.id,
        fullName: item.customer.fullName,
        phone: item.customer.phone,
        email: item.customer.email,
        avatar: item.customer.avatar,
        gender: item.customer.gender as 'male' | 'female' | 'other' | null,
        visitCount: item.visitCount,
        lastVisitDate: item.lastVisitDate,
        totalSpent: Number(item.totalSpent),
        createdAt: Number(item.customer.createdAt),
        lastLoginAt: item.customer.lastLoginAt ? Number(item.customer.lastLoginAt) : null,
      };
    });

    // Sort by last visit date (most recent first)
    customers.sort((a, b) => {
      if (!a.lastVisitDate && !b.lastVisitDate) return 0;
      if (!a.lastVisitDate) return 1;
      if (!b.lastVisitDate) return -1;
      return b.lastVisitDate - a.lastVisitDate;
    });

    return {
      success: true,
      message: 'لیست مشتریان با موفقیت دریافت شد',
      data: {
        customers,
        total: customers.length,
      },
    };
  } catch (error) {
    console.error('Error getting customers:', error);
    return {
      success: false,
      message: 'دریافت لیست مشتریان با خطا مواجه شد',
    };
  }
}

