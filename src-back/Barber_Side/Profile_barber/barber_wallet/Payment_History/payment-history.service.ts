import prisma from '../../../../All_Utils/config/prisma';
import { GetPaymentHistoryResponse, PaymentHistoryItem } from './payment-history.type';

/**
 * Get payment history for barber
 * Returns all payments received by barber from appointments
 */
export async function getPaymentHistoryService(
  barberId: number
): Promise<GetPaymentHistoryResponse> {
  try {
    // Get all payments for appointments where barber is involved
    const payments = await prisma.appointmentPayment.findMany({
      where: {
        appointment: {
          barberId: barberId,
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
            customer: {
              select: {
                id: true,
                fullName: true,
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
        customerName: payment.appointment.customer?.fullName || null,
        customerId: payment.appointment.customerId,
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

