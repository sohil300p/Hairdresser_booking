import prisma from '../../../All_Utils/config/prisma';
import {
  GetWorkingHoursResponse,
  CreateWorkingHoursRequest,
  CreateWorkingHoursResponse,
  EditWorkingHoursRequest,
  EditWorkingHoursResponse,
  ScheduleItem
} from './workinghour.type';

/**
 * Convert HH:mm format to milliseconds since midnight
 */
function timeToMs(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 3600000 + (minutes || 0) * 60000;
}

/**
 * Convert milliseconds to HH:mm format
 */
function msToTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get working hours for barbershop
 */
export async function getWorkingHoursService(barbershopId: number): Promise<GetWorkingHoursResponse> {
  try {
    const schedules = await prisma.barbershopSchedule.findMany({
      where: {
        shopId: barbershopId,
      },
      select: {
        weekday: true,
        openMs: true,
        closeMs: true,
        isClosed: true,
      },
      orderBy: {
        weekday: 'asc',
      },
    });

    const formattedSchedules: ScheduleItem[] = schedules.map((schedule) => ({
      weekday: schedule.weekday,
      openTime: msToTime(schedule.openMs),
      closeTime: msToTime(schedule.closeMs),
      isClosed: schedule.isClosed,
    }));

    return {
      success: true,
      message: 'ساعات کاری با موفقیت دریافت شد',
      data: {
        schedules: formattedSchedules,
      },
    };
  } catch (error) {
    console.error('Error getting working hours:', error);
    return {
      success: false,
      message: 'دریافت ساعات کاری با خطا مواجه شد',
    };
  }
}

/**
 * Create working hours for barbershop
 */
export async function createWorkingHoursService(
  barbershopId: number,
  data: CreateWorkingHoursRequest
): Promise<CreateWorkingHoursResponse> {
  try {
    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    // Check if schedules already exist
    const existingSchedules = await prisma.barbershopSchedule.findMany({
      where: { shopId: barbershopId },
    });

    if (existingSchedules.length > 0) {
      return {
        success: false,
        message: 'ساعات کاری قبلاً ثبت شده‌اند. برای ویرایش از API ویرایش استفاده کنید',
      };
    }

    // Validate schedules
    if (!data.schedules || data.schedules.length === 0) {
      return {
        success: false,
        message: 'حداقل یک روز باید ارسال شود',
      };
    }

    // Validate and prepare schedules
    const schedulesToCreate = data.schedules.map((schedule) => {
      if (schedule.weekday < 0 || schedule.weekday > 6) {
        throw new Error(`روز هفته نامعتبر: ${schedule.weekday}`);
      }

      if (!schedule.isClosed) {
        if (!schedule.openTime || !schedule.closeTime) {
          throw new Error(`ساعت شروع و پایان برای روز ${schedule.weekday} الزامی است`);
        }
      }

      return {
        shopId: barbershopId,
        weekday: schedule.weekday,
        openMs: schedule.isClosed ? 0 : timeToMs(schedule.openTime),
        closeMs: schedule.isClosed ? 0 : timeToMs(schedule.closeTime),
        isClosed: schedule.isClosed || false,
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      };
    });

    // Create schedules
    await prisma.barbershopSchedule.createMany({
      data: schedulesToCreate,
    });

    // Fetch created schedules
    const createdSchedules = await prisma.barbershopSchedule.findMany({
      where: { shopId: barbershopId },
      select: {
        weekday: true,
        openMs: true,
        closeMs: true,
        isClosed: true,
      },
      orderBy: {
        weekday: 'asc',
      },
    });

    const formattedSchedules: ScheduleItem[] = createdSchedules.map((schedule) => ({
      weekday: schedule.weekday,
      openTime: msToTime(schedule.openMs),
      closeTime: msToTime(schedule.closeMs),
      isClosed: schedule.isClosed,
    }));

    return {
      success: true,
      message: 'ساعات کاری با موفقیت ثبت شد',
      data: {
        schedules: formattedSchedules,
      },
    };
  } catch (error) {
    console.error('Error creating working hours:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'ثبت ساعات کاری با خطا مواجه شد',
    };
  }
}

/**
 * Edit working hours for barbershop
 */
export async function editWorkingHoursService(
  barbershopId: number,
  data: EditWorkingHoursRequest
): Promise<EditWorkingHoursResponse> {
  try {
    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    // Validate schedules
    if (!data.schedules || data.schedules.length === 0) {
      return {
        success: false,
        message: 'حداقل یک روز باید ارسال شود',
      };
    }

    // Update or create schedules
    for (const schedule of data.schedules) {
      if (schedule.weekday < 0 || schedule.weekday > 6) {
        return {
          success: false,
          message: `روز هفته نامعتبر: ${schedule.weekday}`,
        };
      }

      const existingSchedule = await prisma.barbershopSchedule.findFirst({
        where: {
          shopId: barbershopId,
          weekday: schedule.weekday,
        },
      });

      const updateData: any = {
        updated: BigInt(Date.now()),
      };

      if (schedule.isClosed !== undefined) {
        updateData.isClosed = schedule.isClosed;
        if (schedule.isClosed) {
          updateData.openMs = 0;
          updateData.closeMs = 0;
        } else {
          if (schedule.openTime) {
            updateData.openMs = timeToMs(schedule.openTime);
          }
          if (schedule.closeTime) {
            updateData.closeMs = timeToMs(schedule.closeTime);
          }
        }
      } else {
        if (schedule.openTime !== undefined) {
          updateData.openMs = timeToMs(schedule.openTime);
        }
        if (schedule.closeTime !== undefined) {
          updateData.closeMs = timeToMs(schedule.closeTime);
        }
      }

      if (existingSchedule) {
        await prisma.barbershopSchedule.update({
          where: { id: existingSchedule.id },
          data: updateData,
        });
      } else {
        await prisma.barbershopSchedule.create({
          data: {
            shopId: barbershopId,
            weekday: schedule.weekday,
            openMs: schedule.openTime ? timeToMs(schedule.openTime) : 0,
            closeMs: schedule.closeTime ? timeToMs(schedule.closeTime) : 0,
            isClosed: schedule.isClosed || false,
            created: BigInt(Date.now()),
            updated: BigInt(Date.now()),
          },
        });
      }
    }

    // Fetch updated schedules
    const updatedSchedules = await prisma.barbershopSchedule.findMany({
      where: { shopId: barbershopId },
      select: {
        weekday: true,
        openMs: true,
        closeMs: true,
        isClosed: true,
      },
      orderBy: {
        weekday: 'asc',
      },
    });

    const formattedSchedules: ScheduleItem[] = updatedSchedules.map((schedule) => ({
      weekday: schedule.weekday,
      openTime: msToTime(schedule.openMs),
      closeTime: msToTime(schedule.closeMs),
      isClosed: schedule.isClosed,
    }));

    return {
      success: true,
      message: 'ساعات کاری با موفقیت به‌روزرسانی شد',
      data: {
        schedules: formattedSchedules,
      },
    };
  } catch (error) {
    console.error('Error editing working hours:', error);
    return {
      success: false,
      message: 'به‌روزرسانی ساعات کاری با خطا مواجه شد',
    };
  }
}

