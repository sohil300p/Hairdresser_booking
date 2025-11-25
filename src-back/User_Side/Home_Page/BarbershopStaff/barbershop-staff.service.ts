import prisma from '../../../All_Utils/config/prisma';
import {
  GetBarbershopStaffRequest,
  GetBarbershopStaffResponse,
  StaffItem,
} from './barbershop-staff.type';

/**
 * Get barbershop staff with action (increment view count)
 */
export async function getBarbershopStaffService(
  params: GetBarbershopStaffRequest
): Promise<GetBarbershopStaffResponse> {
  try {
    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: params.barbershopId },
      select: {
        id: true,
        ownerId: true,
        publicMeta: true,
      },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'آرایشگاه یافت نشد',
      };
    }

    // Increment staff view count (action in database)
    const publicMeta = (barbershop.publicMeta || {}) as any;
    const currentViewCount = typeof publicMeta.staffViewCount === 'number' ? publicMeta.staffViewCount : 0;
    
    await prisma.barbershop.update({
      where: { id: params.barbershopId },
      data: {
        publicMeta: {
          ...publicMeta,
          staffViewCount: currentViewCount + 1,
          lastStaffViewedAt: Date.now(),
        },
        updated: BigInt(Date.now()),
      },
    });

    // Get all barbers who have appointments with this barbershop
    const appointmentBarbers = await prisma.appointmentBarber.findMany({
      where: {
        appointment: {
          barbershopId: params.barbershopId,
        },
      },
      include: {
        barber: {
          include: {
            appointments: {
              where: {
                barbershopId: params.barbershopId,
              },
              select: {
                id: true,
              },
            },
            commentRates: {
              where: {
                barbershopId: params.barbershopId,
              },
              select: {
                rate: true,
              },
            },
          },
        },
      },
      distinct: ['barberId'],
    });

    // Get owner as well
    const owner = await prisma.barber.findUnique({
      where: { id: barbershop.ownerId },
      include: {
        appointments: {
          where: {
            barbershopId: params.barbershopId,
          },
          select: {
            id: true,
          },
        },
        commentRates: {
          where: {
            barbershopId: params.barbershopId,
          },
          select: {
            rate: true,
          },
        },
      },
    });

    // Combine owner and staff
    const allBarbers = new Map<number, any>();
    
    if (owner) {
      allBarbers.set(owner.id, owner);
    }
    
    appointmentBarbers.forEach((ab) => {
      if (ab.barber) {
        allBarbers.set(ab.barber.id, ab.barber);
      }
    });

    // Format staff data
    const staffItems: StaffItem[] = Array.from(allBarbers.values()).map((barber) => {
      const ratings = (barber.commentRates || [])
        .map((cr: any) => cr.rate)
        .filter((r: any): r is number => r !== null && r !== undefined);
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : 0;

      return {
        id: barber.id,
        fullName: barber.fullName,
        specialization: barber.specialization,
        experienceYears: barber.experienceYears,
        bio: barber.bio,
        avatar: barber.avatar,
        gender: barber.gender,
        appointmentCount: barber.appointments?.length || 0,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    });

    // Sort by appointment count (most active first)
    staffItems.sort((a, b) => b.appointmentCount - a.appointmentCount);

    return {
      success: true,
      message: 'پرسنل آرایشگاه با موفقیت دریافت شد',
      data: {
        staff: staffItems,
        total: staffItems.length,
        viewCount: currentViewCount + 1,
      },
    };
  } catch (error) {
    console.error('Error getting barbershop staff:', error);
    return {
      success: false,
      message: 'دریافت پرسنل آرایشگاه با خطا مواجه شد',
    };
  }
}

