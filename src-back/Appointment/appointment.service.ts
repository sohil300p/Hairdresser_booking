import prisma from '../config/prisma';
import {
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAppointmentResponse,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  UpdateAppointmentStatusRequest,
  UpdateAppointmentStatusResponse,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
  RescheduleAppointmentRequest,
  RescheduleAppointmentResponse,
} from './appointment.type';
import { Decimal } from '@prisma/client/runtime/library';
import { checkAvailabilityService } from './availability.service';
import { lockFundsForAppointmentService } from '../Profile_User/Wallet/Transaction/transaction.service';
import { validateCouponService, applyCouponService } from '../Profile_User/Coupon/coupon.service';
import { requestPayment } from '../PaymentGateway/zarrinpal.service';
import dotenv from 'dotenv';

dotenv.config();

const CANCELLATION_REFUND_THRESHOLD_HOURS = 3; // 3 hours before appointment
const CANCELLATION_PENALTY_PERCENT = 25; // 25% penalty if cancelled within 3 hours

/**
 * Create appointment service
 */
export async function createAppointmentService(
  data: CreateAppointmentRequest,
  authenticatedUserId: number
): Promise<CreateAppointmentResponse> {
  try {
    const { barberId, barbershopId, serviceId, date, time, locationType, notes, addonIds, couponCode, paymentMethod } = data;

    // Validate required fields
    if (!barberId && !barbershopId) {
      return {
        success: false,
        message: 'شناسه آرایشگر یا آرایشگاه الزامی است',
      };
    }

    if (!serviceId) {
      return {
        success: false,
        message: 'شناسه سرویس الزامی است',
      };
    }

    // Check availability
    const availabilityCheck = await checkAvailabilityService({
      barberId: barberId || undefined,
      barbershopId: barbershopId || undefined,
      date,
      serviceId,
    });

    if (!availabilityCheck.success || !availabilityCheck.availableSlots) {
      return {
        success: false,
        message: availabilityCheck.message || 'زمان انتخابی در دسترس نیست',
      };
    }

    // Check if selected time is available
    const selectedSlot = availabilityCheck.availableSlots.find((slot) => slot.time === time);
    if (!selectedSlot || !selectedSlot.available) {
      return {
        success: false,
        message: 'زمان انتخابی در دسترس نیست',
      };
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        addons: true,
      },
    });

    if (!service) {
      return {
        success: false,
        message: 'سرویس یافت نشد',
      };
    }

    // Calculate start and end time
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const startTime = BigInt(appointmentDate.getTime());
    const endTime = BigInt(appointmentDate.getTime() + service.estimatedTime * 60 * 1000);

    // Calculate pricing
    let basePrice = service.price ? Number(service.price) : 0;
    let addonsTotal = 0;

    // Calculate addons price
    if (addonIds && addonIds.length > 0) {
      const selectedAddons = service.addons.filter((addon) => addonIds.includes(addon.id));
      addonsTotal = selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: number | undefined;
    if (couponCode) {
      const couponResult = await validateCouponService(
        { code: couponCode, amount: basePrice + addonsTotal },
        authenticatedUserId
      );

      if (couponResult.success && couponResult.coupon && couponResult.coupon.discountAmount) {
        discountAmount = couponResult.coupon.discountAmount;
        couponId = couponResult.coupon.id;
      }
    }

    const priceTotal = basePrice + addonsTotal - discountAmount;

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: authenticatedUserId,
        barberId: barberId || null,
        barbershopId: barbershopId || null,
        serviceId,
        locationType: locationType as any,
        startTime,
        endTime,
        status: 'pending',
        serviceType: service.name,
        notes: notes || null,
        basePrice: new Decimal(basePrice),
        addonsTotal: new Decimal(addonsTotal),
        priceTotal: new Decimal(priceTotal),
        paidAmount: new Decimal(0),
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // Add service addons if any
    if (addonIds && addonIds.length > 0) {
      const selectedAddons = service.addons.filter((addon) => addonIds.includes(addon.id));
      for (const addon of selectedAddons) {
        await prisma.appointmentAddon.create({
          data: {
            appointmentId: appointment.id,
            addonId: addon.id,
            price: addon.price,
            duration: addon.duration,
            created: BigInt(Date.now()),
          },
        });
      }
    }

    // Apply coupon if used
    if (couponId) {
      await applyCouponService(couponId, authenticatedUserId, appointment.id);
    }

    // Create appointment log
    await prisma.appointmentLog.create({
      data: {
        appointmentId: appointment.id,
        status: 'pending',
        changedByType: 'customer',
        changedById: authenticatedUserId,
        changedAt: BigInt(Date.now()),
      },
    });

    // Handle payment
    let paymentUrl: string | undefined;
    let authority: string | undefined;

    if (paymentMethod === 'wallet') {
      // Lock funds from wallet
      const lockResult = await lockFundsForAppointmentService(
        {
          appointmentId: appointment.id,
          amount: priceTotal,
          method: 'wallet',
        },
        authenticatedUserId,
        'customer'
      );

      if (!lockResult.success) {
        // Delete appointment if payment fails
        await prisma.appointment.delete({ where: { id: appointment.id } });
        return {
          success: false,
          message: lockResult.message || 'پرداخت با خطا مواجه شد',
        };
      }

      // Update appointment status to paid
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'paid',
          paidAmount: new Decimal(priceTotal),
          updated: BigInt(Date.now()),
        },
      });

      await prisma.appointmentLog.create({
        data: {
          appointmentId: appointment.id,
          status: 'paid',
          changedByType: 'system',
          note: 'Payment locked from wallet',
          changedAt: BigInt(Date.now()),
        },
      });
    } else if (paymentMethod === 'online' || paymentMethod === 'card') {
      // Create external transaction for online payment
      const externalTx = await prisma.externalTransaction.create({
        data: {
          initiatorType: 'customer',
          initiatorId: authenticatedUserId,
          kind: 'appointment_lock',
          relatedAppointmentId: appointment.id,
          amount: new Decimal(priceTotal),
          method: paymentMethod === 'online' ? 'online' : 'card',
          status: 'pending',
          metadata: {
            appointmentId: appointment.id,
            serviceId,
            barberId,
            barbershopId,
          },
          created: BigInt(Date.now()),
          updated: BigInt(Date.now()),
        },
      });

      // Request payment from ZarrinPal
      const callbackUrl = process.env.ZARRINPAL_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/payment/verify`;
      const customer = await prisma.customer.findUnique({
        where: { id: authenticatedUserId },
        select: { phone: true, email: true },
      });

      const paymentRequest = await requestPayment({
        amount: Math.round(priceTotal),
        description: `پرداخت رزرو نوبت - سرویس: ${service.name}`,
        callbackUrl: `${callbackUrl}?appointmentId=${appointment.id}`,
        mobile: customer?.phone || undefined,
        email: customer?.email || undefined,
        metadata: {
          appointmentId: appointment.id,
          externalTransactionId: externalTx.id,
        },
      });

      if (paymentRequest.success && paymentRequest.paymentUrl && paymentRequest.authority) {
        // Update external transaction with authority
        await prisma.externalTransaction.update({
          where: { id: externalTx.id },
          data: {
            reference: paymentRequest.authority,
            metadata: {
              ...((externalTx.metadata as any) || {}),
              authority: paymentRequest.authority,
              paymentUrl: paymentRequest.paymentUrl,
            },
            updated: BigInt(Date.now()),
          },
        });

        // Update appointment with payment lock reference
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            paymentLockExternalTransactionId: externalTx.id,
            updated: BigInt(Date.now()),
          },
        });

        paymentUrl = paymentRequest.paymentUrl;
        authority = paymentRequest.authority;
      } else {
        // Delete appointment if payment request fails
        await prisma.appointment.delete({ where: { id: appointment.id } });
        return {
          success: false,
          message: paymentRequest.message || 'درخواست پرداخت با خطا مواجه شد',
        };
      }
    }

    return {
      success: true,
      message: 'رزرو با موفقیت ایجاد شد',
      appointmentId: appointment.id,
      paymentUrl,
      authority,
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return {
      success: false,
      message: 'ایجاد رزرو با خطا مواجه شد',
    };
  }
}

/**
 * Get appointment by ID service
 */
export async function getAppointmentService(
  appointmentId: number,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<GetAppointmentResponse> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
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
            price: true,
            estimatedTime: true,
          },
        },
        barbershop: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        addons: {
          include: {
            addon: true,
          },
        },
      },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'رزرو یافت نشد',
      };
    }

    // Check access permission
    if (authenticatedUserType === 'customer' && appointment.customerId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به مشاهده این رزرو نیستید',
      };
    }

    if (authenticatedUserType === 'barber' && appointment.barberId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به مشاهده این رزرو نیستید',
      };
    }

    return {
      success: true,
      message: 'رزرو با موفقیت دریافت شد',
      appointment: {
        id: appointment.id,
        customerId: appointment.customerId,
        barberId: appointment.barberId,
        barbershopId: appointment.barbershopId,
        serviceId: appointment.serviceId,
        startTime: Number(appointment.startTime),
        endTime: Number(appointment.endTime),
        status: appointment.status,
        locationType: appointment.locationType,
        notes: appointment.notes,
        basePrice: appointment.basePrice ? Number(appointment.basePrice) : null,
        addonsTotal: appointment.addonsTotal ? Number(appointment.addonsTotal) : null,
        priceTotal: appointment.priceTotal ? Number(appointment.priceTotal) : null,
        paidAmount: appointment.paidAmount ? Number(appointment.paidAmount) : null,
        createdAt: Number(appointment.created),
        updatedAt: Number(appointment.updated),
        customer: appointment.customer,
        barber: appointment.barber,
        service: appointment.service,
        barbershop: appointment.barbershop,
      },
    };
  } catch (error) {
    console.error('Error getting appointment:', error);
    return {
      success: false,
      message: 'دریافت رزرو با خطا مواجه شد',
    };
  }
}

/**
 * List appointments service
 */
export async function listAppointmentsService(
  data: ListAppointmentsRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<ListAppointmentsResponse> {
  try {
    const { customerId, barberId, barbershopId, status, startDate, endDate, page = 1, limit = 20 } = data;

    const where: any = {};

    // Apply filters based on user type
    if (authenticatedUserType === 'customer') {
      where.customerId = authenticatedUserId;
    } else if (authenticatedUserType === 'barber') {
      where.barberId = authenticatedUserId;
    }

    // Additional filters
    if (customerId) where.customerId = customerId;
    if (barberId) where.barberId = barberId;
    if (barbershopId) where.barbershopId = barbershopId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = BigInt(new Date(startDate).getTime());
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        where.startTime.lte = BigInt(endDateObj.getTime());
      }
    }

    const skip = (page - 1) * limit;

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
              price: true,
            },
          },
          barbershop: {
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

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      barberId: apt.barberId,
      barbershopId: apt.barbershopId,
      serviceId: apt.serviceId,
      startTime: Number(apt.startTime),
      endTime: Number(apt.endTime),
      status: apt.status,
      locationType: apt.locationType,
      priceTotal: apt.priceTotal ? Number(apt.priceTotal) : null,
      paidAmount: apt.paidAmount ? Number(apt.paidAmount) : null,
      customer: apt.customer,
      barber: apt.barber,
      service: apt.service,
      barbershop: apt.barbershop,
    }));

    return {
      success: true,
      message: 'لیست رزروها با موفقیت دریافت شد',
      appointments: formattedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error listing appointments:', error);
    return {
      success: false,
      message: 'دریافت لیست رزروها با خطا مواجه شد',
    };
  }
}

/**
 * Update appointment status service
 */
export async function updateAppointmentStatusService(
  appointmentId: number,
  data: UpdateAppointmentStatusRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<UpdateAppointmentStatusResponse> {
  try {
    const { status, note } = data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'رزرو یافت نشد',
      };
    }

    // Check permissions
    if (authenticatedUserType === 'customer' && appointment.customerId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به تغییر وضعیت این رزرو نیستید',
      };
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['paid', 'cancelled'],
      paid: ['completed', 'cancelled', 'no_show'],
      completed: [],
      cancelled: [],
      no_show: [],
    };

    const allowedStatuses = validTransitions[appointment.status] || [];
    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        message: `تغییر وضعیت از ${appointment.status} به ${status} مجاز نیست`,
      };
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as any,
        updated: BigInt(Date.now()),
      },
    });

    // Create appointment log
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        status: status as any,
        note: note || null,
        changedByType: authenticatedUserType,
        changedById: authenticatedUserId,
        changedAt: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'وضعیت رزرو با موفقیت به‌روزرسانی شد',
      appointmentId,
    };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {
      success: false,
      message: 'به‌روزرسانی وضعیت رزرو با خطا مواجه شد',
    };
  }
}

/**
 * Cancel appointment service with refund calculation
 */
export async function cancelAppointmentService(
  appointmentId: number,
  data: CancelAppointmentRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<CancelAppointmentResponse> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
      },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'رزرو یافت نشد',
      };
    }

    // Check permissions
    if (authenticatedUserType === 'customer' && appointment.customerId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به لغو این رزرو نیستید',
      };
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return {
        success: false,
        message: 'این رزرو قبلاً لغو شده است',
      };
    }

    if (appointment.status === 'completed') {
      return {
        success: false,
        message: 'رزرو تکمیل شده قابل لغو نیست',
      };
    }

    // Calculate refund
    const now = Date.now();
    const appointmentStart = Number(appointment.startTime);
    const hoursUntilAppointment = (appointmentStart - now) / (1000 * 60 * 60);

    const priceTotal = appointment.priceTotal ? Number(appointment.priceTotal) : 0;
    const paidAmount = appointment.paidAmount ? Number(appointment.paidAmount) : 0;

    let refundAmount = 0;
    let refundPercentage = 100;

    if (paidAmount > 0) {
      if (hoursUntilAppointment > CANCELLATION_REFUND_THRESHOLD_HOURS) {
        // Full refund (>3 hours before)
        refundAmount = paidAmount;
        refundPercentage = 100;
      } else {
        // Partial refund with penalty (≤3 hours before)
        refundAmount = paidAmount * (1 - CANCELLATION_PENALTY_PERCENT / 100);
        refundPercentage = 100 - CANCELLATION_PENALTY_PERCENT;
      }
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'cancelled',
        updated: BigInt(Date.now()),
      },
    });

    // Create appointment log
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        status: 'cancelled',
        note: data.reason || `Cancelled by ${authenticatedUserType}. Refund: ${refundAmount} (${refundPercentage}%)`,
        changedByType: authenticatedUserType,
        changedById: authenticatedUserId,
        changedAt: BigInt(Date.now()),
      },
    });

    // Process refund if applicable
    if (refundAmount > 0 && appointment.paymentLockExternalTransactionId) {
      // Get the external transaction
      const externalTx = await prisma.externalTransaction.findUnique({
        where: { id: appointment.paymentLockExternalTransactionId },
      });

      if (externalTx && externalTx.status === 'success') {
        // Create refund transaction
        const refundTx = await prisma.externalTransaction.create({
          data: {
            initiatorType: 'system',
            initiatorId: 0, // System-initiated refund
            kind: 'withdrawal', // Refund is treated as withdrawal from barber/platform
            relatedAppointmentId: appointmentId,
            amount: new Decimal(refundAmount),
            method: 'wallet',
            status: 'success',
            metadata: {
              type: 'refund',
              originalTransactionId: externalTx.id,
              refundPercentage,
            },
            created: BigInt(Date.now()),
            updated: BigInt(Date.now()),
          },
        });

        // Get customer wallet
        const customerWallet = await prisma.wallet.findFirst({
          where: {
            ownerType: 'customer',
            ownerId: appointment.customerId,
          },
        });

        if (customerWallet) {
          // Create internal transaction (credit to customer wallet)
          await prisma.internalTransaction.create({
            data: {
              parentExternalTransactionId: refundTx.id,
              toWalletId: customerWallet.id,
              amount: new Decimal(refundAmount),
              direction: 'credit',
              note: `Refund for cancelled appointment ${appointmentId}`,
              created: BigInt(Date.now()),
            },
          });

          // Update wallet balance
          const { calculateWalletBalance } = await import('../Profile_User/Wallet/Transaction/transaction.service');
          const newBalance = await calculateWalletBalance(customerWallet.id);
          await prisma.wallet.update({
            where: { id: customerWallet.id },
            data: {
              balance: newBalance,
              updated: BigInt(Date.now()),
            },
          });

          // Update customer cached balance
          await prisma.customer.update({
            where: { id: appointment.customerId },
            data: {
              walletBalance: newBalance,
              updated: BigInt(Date.now()),
            },
          });
        }
      }
    }

    return {
      success: true,
      message: 'رزرو با موفقیت لغو شد',
      refundAmount,
      refundPercentage,
      appointmentId,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      message: 'لغو رزرو با خطا مواجه شد',
    };
  }
}

/**
 * Reschedule appointment service
 */
export async function rescheduleAppointmentService(
  appointmentId: number,
  data: RescheduleAppointmentRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<RescheduleAppointmentResponse> {
  try {
    const { date, time } = data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
      },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'رزرو یافت نشد',
      };
    }

    // Check permissions
    if (authenticatedUserType === 'customer' && appointment.customerId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به تغییر زمان این رزرو نیستید',
      };
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return {
        success: false,
        message: 'این رزرو قابل تغییر زمان نیست',
      };
    }

    // Check availability for new time
    const availabilityCheck = await checkAvailabilityService({
      barberId: appointment.barberId || undefined,
      barbershopId: appointment.barbershopId || undefined,
      date,
      serviceId: appointment.serviceId || undefined,
    });

    if (!availabilityCheck.success || !availabilityCheck.availableSlots) {
      return {
        success: false,
        message: availabilityCheck.message || 'زمان انتخابی در دسترس نیست',
      };
    }

    const selectedSlot = availabilityCheck.availableSlots.find((slot) => slot.time === time);
    if (!selectedSlot || !selectedSlot.available) {
      return {
        success: false,
        message: 'زمان انتخابی در دسترس نیست',
      };
    }

    // Calculate new start and end time
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const startTime = BigInt(appointmentDate.getTime());
    const serviceDuration = appointment.service?.estimatedTime || 30;
    const endTime = BigInt(appointmentDate.getTime() + serviceDuration * 60 * 1000);

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime,
        endTime,
        updated: BigInt(Date.now()),
      },
    });

    // Create appointment log
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        status: appointment.status,
        note: `Rescheduled to ${date} at ${time}`,
        changedByType: authenticatedUserType,
        changedById: authenticatedUserId,
        changedAt: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'زمان رزرو با موفقیت تغییر یافت',
      appointmentId,
    };
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return {
      success: false,
      message: 'تغییر زمان رزرو با خطا مواجه شد',
    };
  }
}

