import prisma from '../config/prisma';
import { resetOtpLimitService, getOtpAttemptsInfo } from '../OTP/otp.service';

export interface AdminUser {
  id: number;
  fullName: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  gender: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  appointmentCount: number;
}

export interface AdminStaff {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  permissions: any;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AdminBarbershopReservationTier {
  minHoursBefore: number;
  feePercent: number;
}

export interface AdminBarbershop {
  id: number;
  name: string;
  platformCommissionPercent: number | null;
  reservationPaymentPercent: number | null;
  cancellationPolicy: string | null;
  cancellationTiers: AdminBarbershopReservationTier[] | null;
}

export interface AdminBarber {
  id: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  experienceYears: number | null;
  avatar: string | null;
  gender: string | null;
  walletBalance: number;
  barbershopCount: number;
  appointmentCount: number;
  barbershops: AdminBarbershop[];
}

export interface AdminAppointment {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  barberId: number | null;
  barberName: string | null;
  barbershopId: number | null;
  barbershopName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  startTime: bigint;
  endTime: bigint;
  status: string;
  priceTotal: number | null;
  paidAmount: number | null;
  createdAt: Date;
}

export async function getAllUsersService() {
  try {
    console.log('📊 Fetching all users from database...');
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatar: true,
        gender: true,
        createdAt: true,
        lastLoginAt: true,
        appointments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${customers.length} customers`);

    const users: AdminUser[] = customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      avatar: customer.avatar,
      gender: customer.gender,
      createdAt: customer.createdAt,
      lastLoginAt: customer.lastLoginAt,
      appointmentCount: customer.appointments.length,
    }));

    console.log(`✅ Returning ${users.length} users`);
    return { success: true, users };
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAllBarbersService() {
  try {
    const barbers = await prisma.barber.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        specialization: true,
        experienceYears: true,
        avatar: true,
        gender: true,
        walletBalance: true,
        customer: {
          select: { fullName: true, phone: true },
        },
        ownedBarbershops: {
          select: {
            id: true,
            name: true,
            platformCommissionPercent: true,
            reservationPaymentPercent: true,
            cancellationPolicy: true,
            cancellationTiers: true,
          },
        },
        appointments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const barbersList: AdminBarber[] = barbers.map((barber) => ({
      id: barber.id,
      fullName: barber.fullName ?? barber.customer?.fullName ?? null,
      phone: barber.phone ?? barber.customer?.phone ?? null,
      email: barber.email,
      specialization: barber.specialization,
      experienceYears: barber.experienceYears,
      avatar: barber.avatar,
      gender: barber.gender,
      walletBalance: Number(barber.walletBalance),
      barbershopCount: barber.ownedBarbershops.length,
      appointmentCount: barber.appointments.length,
      barbershops: barber.ownedBarbershops.map((s) => ({
        id: s.id,
        name: s.name,
        platformCommissionPercent: s.platformCommissionPercent,
        reservationPaymentPercent: s.reservationPaymentPercent,
        cancellationPolicy: s.cancellationPolicy,
        cancellationTiers: (s.cancellationTiers as AdminBarbershopReservationTier[] | null) ?? null,
      })),
    }));

    return { success: true, barbers: barbersList };
  } catch (error) {
    console.error('Error getting all barbers:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAllAppointmentsService() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        barber: {
          select: {
            fullName: true,
          },
        },
        barbershop: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 1000,
    });

    const appointmentsList: AdminAppointment[] = appointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      customerName: apt.customer.fullName,
      customerPhone: apt.customer.phone,
      barberId: apt.barberId,
      barberName: apt.barber?.fullName || null,
      barbershopId: apt.barbershopId,
      barbershopName: apt.barbershop?.name || null,
      serviceId: apt.serviceId,
      serviceName: apt.service?.name || null,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      priceTotal: apt.priceTotal ? Number(apt.priceTotal) : null,
      paidAmount: apt.paidAmount ? Number(apt.paidAmount) : null,
      createdAt: new Date(Number(apt.startTime)),
    }));

    return { success: true, appointments: appointmentsList };
  } catch (error) {
    console.error('Error getting all appointments:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reset OTP limit for a user
 */
export async function resetUserOtpLimitService(phone: string) {
  try {
    console.log(`🔄 Resetting OTP limit for phone: ${phone}`);
    
    // Verify phone exists in database
    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true, fullName: true, phone: true },
    });

    if (!customer) {
      return {
        success: false,
        message: `کاربری با شماره ${phone} یافت نشد`,
      };
    }

    // Reset OTP limit in Redis
    const result = await resetOtpLimitService(phone);
    
    if (result.success) {
      console.log(`✅ OTP limit reset for ${phone}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error resetting OTP limit:', error);
    return {
      success: false,
      message: 'خطا در بازنشانی محدودیت OTP',
      error: String(error),
    };
  }
}

/**
 * Get OTP status for a user
 */
export async function getUserOtpStatusService(phone: string) {
  try {
    console.log(`📊 Getting OTP status for phone: ${phone}`);
    
    // Get OTP attempts info
    const result = await getOtpAttemptsInfo(phone);
    
    return result;
  } catch (error) {
    console.error('❌ Error getting OTP status:', error);
    return {
      success: false,
      message: 'خطا در دریافت وضعیت OTP',
      error: String(error),
    };
  }
}

/**
 * Get all admins and staff
 */
export async function getAllAdminsService() {
  try {
    console.log('📊 Fetching all admins/staff from database...');
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${admins.length} admins/staff`);

    const adminsList: AdminStaff[] = admins.map((admin) => ({
      id: admin.id,
      fullName: admin.fullName,
      phone: admin.phone,
      email: admin.email,
      avatar: admin.avatar,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    }));

    console.log(`✅ Returning ${adminsList.length} admins/staff`);
    return { success: true, admins: adminsList };
  } catch (error) {
    console.error('❌ Error getting all admins:', error);
    return { success: false, error: String(error) };
  }
}

export interface AdminBarberAppointment {
  id: number;
  startTime: number;
  endTime: number;
  status: string;
  customerName: string | null;
  customerPhone: string;
  serviceName: string | null;
  barbershopName: string | null;
  priceTotal: number | null;
}

export async function getBarberAppointmentsService(barberId: number) {
  try {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });
    if (!barber) return { success: false, message: 'Barber not found' };

    const appointments = await prisma.appointment.findMany({
      where: { barberId },
      include: {
        customer: { select: { fullName: true, phone: true } },
        service: { select: { name: true } },
        barbershop: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 500,
    });

    const list: AdminBarberAppointment[] = appointments.map((a) => ({
      id: a.id,
      startTime: Number(a.startTime),
      endTime: Number(a.endTime),
      status: a.status,
      customerName: a.customer?.fullName ?? null,
      customerPhone: a.customer?.phone ?? '',
      serviceName: a.service?.name ?? null,
      barbershopName: a.barbershop?.name ?? null,
      priceTotal: a.priceTotal != null ? Number(a.priceTotal) : null,
    }));

    return { success: true, appointments: list };
  } catch (error) {
    console.error('Error getBarberAppointments:', error);
    return { success: false, error: String(error) };
  }
}

export interface AdminBarbershopServiceItem {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  gender: string;
}

export async function getBarbershopServicesForAdminService(barbershopId: number) {
  try {
    const services = await prisma.service.findMany({
      where: { barbershopId, parentServiceId: null },
      select: { id: true, name: true, price: true, estimatedTime: true, gender: true },
      orderBy: { created: 'asc' },
    });

    const list: AdminBarbershopServiceItem[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price != null ? Number(s.price) : null,
      estimatedTime: s.estimatedTime,
      gender: s.gender,
    }));

    return { success: true, services: list };
  } catch (error) {
    console.error('Error getBarbershopServicesForAdmin:', error);
    return { success: false, error: String(error) };
  }
}

export async function clearBarberReservationsService(barberId: number) {
  try {
    const barber = await prisma.barber.findUnique({ where: { id: barberId }, select: { id: true } });
    if (!barber) return { success: false, message: 'Barber not found' };

    const now = BigInt(Date.now());
    const updated = await prisma.appointment.updateMany({
      where: { barberId, startTime: { gt: now }, status: { not: 'cancelled' } },
      data: { status: 'cancelled' },
    });

    return { success: true, cancelledCount: updated.count };
  } catch (error) {
    console.error('Error clearBarberReservations:', error);
    return { success: false, error: String(error) };
  }
}

export async function clearBarberFinancialService(barberId: number) {
  try {
    const barber = await prisma.barber.findUnique({ where: { id: barberId }, select: { id: true, walletBalance: true } });
    if (!barber) return { success: false, message: 'Barber not found' };

    await prisma.barber.update({
      where: { id: barberId },
      data: { walletBalance: 0 },
    });

    return { success: true, previousBalance: Number(barber.walletBalance ?? 0) };
  } catch (error) {
    console.error('Error clearBarberFinancial:', error);
    return { success: false, error: String(error) };
  }
}

