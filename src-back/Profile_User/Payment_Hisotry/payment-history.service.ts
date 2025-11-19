import prisma from '../../config/prisma';
import { GetPaymentHistoryResponse, PaymentHistoryItem } from './payment-history.type';

export async function getPaymentHistoryService(
  customerId: number
): Promise<GetPaymentHistoryResponse> {
  try {
    const payments = await prisma.appointmentPayment.findMany({
      where: {
        appointment: {
          customerId: customerId,
        },
      },
      include: {
        appointment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
            barbershop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        externalTx: {
          select: {
            status: true,
            method: true,
            created: true,
          },
        },
      },
      orderBy: {
        created: 'desc',
      },
    });

    const paymentHistory: PaymentHistoryItem[] = payments.map((payment) => {
      const status = payment.externalTx?.status || 'pending';
      const paymentMethod = payment.externalTx?.method || payment.method || null;
      const date = payment.paidAt 
        ? Number(payment.paidAt) 
        : payment.externalTx?.created 
        ? Number(payment.externalTx.created) 
        : Number(payment.created);

      return {
        id: payment.id,
        serviceType: payment.appointment.serviceType || null,
        serviceName: payment.appointment.service?.name || null,
        barbershopName: payment.appointment.barbershop?.name || null,
        barbershopId: payment.appointment.barbershopId,
        price: Number(payment.amount),
        date: date,
        status: status as 'pending' | 'success' | 'failed',
        paymentMethod: paymentMethod as 'cash' | 'card' | 'online' | 'wallet' | null,
        appointmentId: payment.appointmentId,
      };
    });

    return {
      success: true,
      message: 'تاریخچه پرداخت با موفقیت دریافت شد',
      data: {
        payments: paymentHistory,
        total: paymentHistory.length,
      },
    };
  } catch (error) {
    console.error('Error in getPaymentHistoryService:', error);
    return {
      success: false,
      message: 'خطا در دریافت تاریخچه پرداخت',
    };
  }
}

