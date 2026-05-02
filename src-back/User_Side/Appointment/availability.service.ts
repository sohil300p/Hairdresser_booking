import prisma from '../../All_Utils/config/prisma';
import { CheckAvailabilityRequest, CheckAvailabilityResponse } from './appointment.type';
import { resolveReservationPolicy } from '../../All_Utils/ReservationPolicy/reservation-policy.resolver';

// Defaults are handled by ReservationPolicyResolver.

/**
 * Convert time string (HH:MM) to milliseconds since midnight
 */
function timeToMs(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Convert milliseconds since midnight to time string (HH:MM)
 */
function msToTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get weekday from date (0 = Sunday, 6 = Saturday)
 */
function getWeekday(date: Date): number {
  const day = date.getDay();
  // Convert to Monday = 0, Sunday = 6
  return day === 0 ? 6 : day - 1;
}

/**
 * Check availability service
 */
export async function checkAvailabilityService(
  data: CheckAvailabilityRequest
): Promise<CheckAvailabilityResponse> {
  try {
    const { barberId, barbershopId, date, serviceId } = data;

    if (!barberId && !barbershopId) {
      return {
        success: false,
        message: 'شناسه آرایشگر یا آرایشگاه الزامی است',
      };
    }

    const policy = await resolveReservationPolicy({ barbershopId: barbershopId ?? undefined, serviceId: serviceId ?? undefined, barberId: barberId ?? undefined });

    const targetDate = new Date(date);
    const now = new Date();

    // Check if date is in the past
    if (targetDate < now) {
      return {
        success: false,
        message: 'تاریخ انتخابی در گذشته است',
      };
    }

    // Check minimum advance booking time (policy-aware)
    const minAdvanceMs = policy.minAdvanceMinutes * 60 * 1000;
    const msUntilDate = targetDate.getTime() - now.getTime();
    if (msUntilDate < minAdvanceMs) {
      return {
        success: false,
        message: `حداقل ${policy.minAdvanceMinutes} دقیقه قبل از زمان رزرو باید اقدام کنید`,
      };
    }

    // Get service duration if serviceId provided
    let serviceDuration = 30; // minutes (fallback)
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { estimatedTime: true },
      });
      if (service) {
        serviceDuration = service.estimatedTime;
      }
    }
    // Apply buffers (policy-aware). We treat buffers as blocked time around the appointment.
    const blockedDurationMinutes = serviceDuration + policy.bufferBeforeMinutes + policy.bufferAfterMinutes;

    const weekday = getWeekday(targetDate);
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const dateStartMs = dateStart.getTime();
    const dateEndMs = dateEnd.getTime();

    // Get barber schedule for this weekday
    let barberSchedule: { startMs: number; endMs: number } | null = null;
    if (barberId) {
      const schedule = await prisma.barberSchedule.findFirst({
        where: {
          barberId,
          weekday,
        },
      });

      if (schedule) {
        barberSchedule = {
          startMs: schedule.startMs,
          endMs: schedule.endMs,
        };
      }
    }

    // Get barbershop schedule for this weekday
    let barbershopSchedule: { openMs: number; closeMs: number; isClosed: boolean } | null = null;
    if (barbershopId) {
      const shopSchedule = await prisma.barbershopSchedule.findFirst({
        where: {
          shopId: barbershopId,
          weekday,
        },
      });

      if (shopSchedule) {
        barbershopSchedule = {
          openMs: shopSchedule.openMs,
          closeMs: shopSchedule.closeMs,
          isClosed: shopSchedule.isClosed,
        };
      }
    }

    // Check if barbershop is closed
    if (barbershopSchedule?.isClosed) {
      return {
        success: true,
        message: 'آرایشگاه در این روز تعطیل است',
        availableSlots: [],
        date,
      };
    }

    // Get barber time off periods
    const timeOffs = barberId
      ? await prisma.barberTimeOff.findMany({
          where: {
            barberId,
            startAt: { lte: BigInt(dateEndMs) },
            endAt: { gte: BigInt(dateStartMs) },
          },
        })
      : [];

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        ...(barberId ? { barberId } : {}),
        ...(barbershopId ? { barbershopId } : {}),
        startTime: { gte: BigInt(dateStartMs), lte: BigInt(dateEndMs) },
        status: {
          notIn: ['cancelled', 'no_show'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Determine working hours
    let workingStartMs = timeToMs('09:00'); // default 9 AM
    let workingEndMs = timeToMs('18:00'); // default 6 PM

    if (barberSchedule) {
      workingStartMs = Math.max(workingStartMs, barberSchedule.startMs);
      workingEndMs = Math.min(workingEndMs, barberSchedule.endMs);
    }

    if (barbershopSchedule && !barbershopSchedule.isClosed) {
      workingStartMs = Math.max(workingStartMs, barbershopSchedule.openMs);
      workingEndMs = Math.min(workingEndMs, barbershopSchedule.closeMs);
    }

    // Generate time slots
    const availableSlots: Array<{ time: string; available: boolean }> = [];
    let currentTimeMs = workingStartMs;

    const slotStepMinutes = policy.slotGranularityMinutes;
    while (currentTimeMs + blockedDurationMinutes * 60 * 1000 <= workingEndMs) {
      const slotTime = msToTime(currentTimeMs);
      // Note: schedules are stored as ms since midnight, but appointments/timeOff are stored as epoch ms.
      // Convert slot start/end to epoch ms for conflict checks.
      const slotStartEpochMs = dateStartMs + currentTimeMs;
      const slotEndEpochMs = slotStartEpochMs + blockedDurationMinutes * 60 * 1000;

      // Check if slot conflicts with time off
      const conflictsWithTimeOff = timeOffs.some((timeOff) => {
        const offStart = Number(timeOff.startAt); // epoch ms
        const offEnd = Number(timeOff.endAt); // epoch ms
        return (
          (slotStartEpochMs >= offStart && slotStartEpochMs < offEnd) ||
          (slotEndEpochMs > offStart && slotEndEpochMs <= offEnd) ||
          (slotStartEpochMs <= offStart && slotEndEpochMs >= offEnd)
        );
      });

      // Check if slot conflicts with existing appointments
      const conflictsWithAppointment = existingAppointments.some((apt) => {
        const aptStart = Number(apt.startTime); // epoch ms
        const aptEnd = Number(apt.endTime); // epoch ms
        return (
          (slotStartEpochMs >= aptStart && slotStartEpochMs < aptEnd) ||
          (slotEndEpochMs > aptStart && slotEndEpochMs <= aptEnd) ||
          (slotStartEpochMs <= aptStart && slotEndEpochMs >= aptEnd)
        );
      });

      // Check if slot is too close to current time (minimum advance)
      const tooSoon = slotStartEpochMs - now.getTime() < minAdvanceMs;

      const available = !conflictsWithTimeOff && !conflictsWithAppointment && !tooSoon;

      availableSlots.push({
        time: slotTime,
        available,
      });

      // Move to next slot (policy-aware granularity)
      currentTimeMs += slotStepMinutes * 60 * 1000;
    }

    return {
      success: true,
      message: 'زمان‌های موجود با موفقیت دریافت شد',
      availableSlots,
      date,
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      message: 'بررسی زمان‌های موجود با خطا مواجه شد',
    };
  }
}

