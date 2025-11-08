import prisma from "../config/prisma";
import {
  GetBarbersRequest,
  GetBarbersResponse,
  GetBarberByIdResponse,
  BarberResponse,
} from "./Hairdresser.type";

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all barbers with optional geographical filtering
 */
export async function getBarbersService(
  params: GetBarbersRequest = {}
): Promise<GetBarbersResponse> {
  try {
    const barbers = await prisma.barber.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
    });

    let barbersWithDistance: BarberResponse[] = barbers.map((barber) => {
      const fullName =
        barber.user.firstName && barber.user.lastName
          ? `${barber.user.firstName} ${barber.user.lastName}`
          : barber.user.firstName || barber.user.lastName || "بدون نام";

      return {
        id: barber.id,
        userId: barber.userId,
        name: fullName,
        specialization: barber.specialization,
        experienceYears: barber.experienceYears,
        rating: barber.rating,
        bio: barber.bio,
        profileImage: barber.profileImage,
        user: {
          id: barber.user.id,
          firstName: barber.user.firstName,
          lastName: barber.user.lastName,
          phone: barber.user.phone,
        },
      };
    });

    // Apply geographical filtering if coordinates provided
    if (params.lat !== undefined && params.lng !== undefined) {
      // Note: Barber model doesn't have location fields yet
      // For now, we'll return all barbers
      // TODO: Add location fields (lat/lng) to Barber model and filter here
      // For demonstration, we'll add a mock distance calculation
      // In production, you'd filter barbers based on their stored location
    }

    // Filter by radius if provided
    if (
      params.radius !== undefined &&
      params.lat !== undefined &&
      params.lng !== undefined
    ) {
      // Note: This will work once location fields are added to Barber model
      // For now, we return all barbers
    }

    return {
      success: true,
      message: "لیست آرایشگران با موفقیت دریافت شد",
      data: barbersWithDistance,
    };
  } catch (error) {
    console.error("Error getting barbers:", error);
    return {
      success: false,
      message: "دریافت لیست آرایشگران با خطا مواجه شد",
    };
  }
}

/**
 * Get single barber by ID
 */
export async function getBarberByIdService(
  barberId: number
): Promise<GetBarberByIdResponse> {
  try {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!barber) {
      return {
        success: false,
        message: "آرایشگر یافت نشد",
      };
    }

    const fullName =
      barber.user.firstName && barber.user.lastName
        ? `${barber.user.firstName} ${barber.user.lastName}`
        : barber.user.firstName || barber.user.lastName || "بدون نام";

    const barberResponse: BarberResponse = {
      id: barber.id,
      userId: barber.userId,
      name: fullName,
      specialization: barber.specialization,
      experienceYears: barber.experienceYears,
      rating: barber.rating,
      bio: barber.bio,
      profileImage: barber.profileImage,
      user: {
        id: barber.user.id,
        firstName: barber.user.firstName,
        lastName: barber.user.lastName,
        phone: barber.user.phone,
      },
    };

    return {
      success: true,
      message: "اطلاعات آرایشگر با موفقیت دریافت شد",
      data: barberResponse,
    };
  } catch (error) {
    console.error("Error getting barber by ID:", error);
    return {
      success: false,
      message: "دریافت اطلاعات آرایشگر با خطا مواجه شد",
    };
  }
}
