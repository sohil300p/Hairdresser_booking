import prisma from "../config/prisma";
import {
  GetBarbersRequest,
  GetBarbersResponse,
  GetBarberByIdResponse,
  BarbershopResponse,
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
 * Check if barbershop is currently open
 */
function isBarbershopOpen(
  schedules: Array<{ weekday: number; openMs: number; closeMs: number; isClosed: boolean }>,
  openingTime?: string | null,
  closingTime?: string | null
): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;

  // Check schedule for current day
  const todaySchedule = schedules.find(s => s.weekday === currentDay);
  
  if (todaySchedule) {
    if (todaySchedule.isClosed) {
      return false;
    }
    return currentMs >= todaySchedule.openMs && currentMs <= todaySchedule.closeMs;
  }

  // Fallback to openingTime/closingTime if schedule not available
  if (openingTime && closingTime) {
    // Simple time comparison (assuming format like "09:00" or "09:00:00")
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);
    const openMs = (openHour || 0) * 3600000 + (openMin || 0) * 60000;
    const closeMs = (closeHour || 0) * 3600000 + (closeMin || 0) * 60000;
    
    return currentMs >= openMs && currentMs <= closeMs;
  }

  return true; // Default to open if no schedule info
}

/**
 * Extract discount percentage from publicMeta
 */
function getDiscountPercentage(publicMeta: any): number | null {
  if (!publicMeta || typeof publicMeta !== 'object') {
    return null;
  }
  
  if (typeof publicMeta.discountPercentage === 'number') {
    return publicMeta.discountPercentage;
  }
  
  if (typeof publicMeta.discount === 'number') {
    return publicMeta.discount;
  }
  
  return null;
}

/**
 * Get all barbershops for homepage
 */
export async function getBarbersService(
  params: GetBarbersRequest = {}
): Promise<GetBarbersResponse> {
  try {
    const barbershops = await prisma.barbershop.findMany({
      where: {
        active: true,
      },
      include: {
        services: {
          select: {
            price: true,
          },
          where: {
            price: {
              not: null,
            },
          },
        },
        commentRates: true,
        schedules: {
          select: {
            weekday: true,
            openMs: true,
            closeMs: true,
            isClosed: true,
          },
        },
      } as any,
    });

    const now = Date.now();
    const barbershopsWithData: BarbershopResponse[] = barbershops.map((shop: any) => {
      // Calculate distance if coordinates provided
      let distance: number | undefined;
      if (params.lat !== undefined && params.lng !== undefined && shop.latitude && shop.longitude) {
        distance = calculateDistance(
          params.lat,
          params.lng,
          Number(shop.latitude),
          Number(shop.longitude)
        );
      }

      // Calculate average rating and count
      const ratings = (shop.commentRates || [])
        .map((cr: any) => cr.rate)
        .filter((r: any): r is number => r !== null && r !== undefined);
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : shop.averageRating || 0;
      const ratingCount = ratings.length || shop.ratingCount || 0;

      // Calculate min price (priceFrom)
      const prices = (shop.services || [])
        .map((s: any) => s.price)
        .filter((p: any): p is NonNullable<typeof p> => p !== null)
        .map((p: any) => Number(p));
      const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

      // Check if open
      const isOpen = isBarbershopOpen(shop.schedules || [], shop.openingTime, shop.closingTime);

      // Get discount percentage from publicMeta
      const discountPercentage = shop.publicMeta ? getDiscountPercentage(shop.publicMeta as any) : null;

      return {
        id: shop.id,
        name: shop.name,
        distance,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingCount,
        priceFrom,
        isOpen,
        discountPercentage,
        avatar: shop.avatar,
      };
    });

    // Filter by radius if provided
    let filteredBarbershops = barbershopsWithData;
    if (params.radius !== undefined && params.lat !== undefined && params.lng !== undefined) {
      filteredBarbershops = barbershopsWithData.filter(
        (shop) => shop.distance !== undefined && shop.distance <= params.radius!
      );
    }

    // Sort by distance if coordinates provided, otherwise by rating
    if (params.lat !== undefined && params.lng !== undefined) {
      filteredBarbershops.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return (b.averageRating || 0) - (a.averageRating || 0);
      });
    } else {
      filteredBarbershops.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    return {
      success: true,
      message: "لیست آرایشگاه‌ها با موفقیت دریافت شد",
      data: filteredBarbershops,
    };
  } catch (error) {
    console.error("Error getting barbershops:", error);
    return {
      success: false,
      message: "دریافت لیست آرایشگاه‌ها با خطا مواجه شد",
    };
  }
}

/**
 * Get single barbershop by ID
 */
export async function getBarberByIdService(
  barbershopId: number
): Promise<GetBarberByIdResponse> {
  try {
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      include: {
        services: {
          select: {
            price: true,
          },
          where: {
            price: {
              not: null,
            },
          },
        },
        commentRates: true,
        schedules: {
          select: {
            weekday: true,
            openMs: true,
            closeMs: true,
            isClosed: true,
          },
        },
      } as any,
    });

    if (!barbershop) {
      return {
        success: false,
        message: "آرایشگاه یافت نشد",
      };
    }

    // Calculate average rating and count
    const shop = barbershop as any;
    const ratings = (shop.commentRates || [])
      .map((cr: any) => cr.rate)
      .filter((r: any): r is number => r !== null && r !== undefined);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      : shop.averageRating || 0;
    const ratingCount = ratings.length || shop.ratingCount || 0;

    // Calculate min price (priceFrom)
    const prices = (shop.services || [])
      .map((s: any) => s.price)
      .filter((p: any): p is NonNullable<typeof p> => p !== null)
      .map((p: any) => Number(p));
    const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

    // Check if open
    const isOpen = isBarbershopOpen(shop.schedules || [], shop.openingTime, shop.closingTime);

    // Get discount percentage from publicMeta
    const discountPercentage = shop.publicMeta ? getDiscountPercentage(shop.publicMeta as any) : null;

    const barbershopResponse: BarbershopResponse = {
      id: shop.id,
      name: shop.name,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount,
      priceFrom,
      isOpen,
      discountPercentage,
      avatar: shop.avatar,
    };

    return {
      success: true,
      message: "اطلاعات آرایشگاه با موفقیت دریافت شد",
      data: barbershopResponse,
    };
  } catch (error) {
    console.error("Error getting barbershop by ID:", error);
    return {
      success: false,
      message: "دریافت اطلاعات آرایشگاه با خطا مواجه شد",
    };
  }
}
