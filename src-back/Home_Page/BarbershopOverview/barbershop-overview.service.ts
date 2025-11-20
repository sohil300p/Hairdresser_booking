import prisma from '../../config/prisma';
import {
  GetBarbershopOverviewRequest,
  GetBarbershopOverviewResponse,
  BarbershopOverviewResponse,
} from './barbershop-overview.type';

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

  const todaySchedule = schedules.find(s => s.weekday === currentDay);
  
  if (todaySchedule) {
    if (todaySchedule.isClosed) {
      return false;
    }
    return currentMs >= todaySchedule.openMs && currentMs <= todaySchedule.closeMs;
  }

  if (openingTime && closingTime) {
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);
    const openMs = (openHour || 0) * 3600000 + (openMin || 0) * 60000;
    const closeMs = (closeHour || 0) * 3600000 + (closeMin || 0) * 60000;
    
    return currentMs >= openMs && currentMs <= closeMs;
  }

  return true;
}

/**
 * Get barbershop overview with action (increment view count)
 */
export async function getBarbershopOverviewService(
  params: GetBarbershopOverviewRequest
): Promise<GetBarbershopOverviewResponse> {
  try {
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: params.barbershopId },
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
        commentRates: {
          select: {
            rate: true,
          },
        },
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
        message: 'آرایشگاه یافت نشد',
      };
    }

    // Increment view count (action in database)
    const shop = barbershop as any;
    const publicMeta = (shop.publicMeta || {}) as any;
    const currentViewCount = typeof publicMeta.viewCount === 'number' ? publicMeta.viewCount : 0;
    
    await prisma.barbershop.update({
      where: { id: params.barbershopId },
      data: {
        publicMeta: {
          ...publicMeta,
          viewCount: currentViewCount + 1,
          lastViewedAt: Date.now(),
        },
        updated: BigInt(Date.now()),
      },
    });

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

    // Get background image from publicMeta
    const backgroundImage = publicMeta.backgroundImage || publicMeta.background || null;

    const overview: BarbershopOverviewResponse = {
      id: shop.id,
      name: shop.name,
      backgroundImage,
      avatar: shop.avatar,
      isOpen,
      ratingCount,
      averageRating: Math.round(averageRating * 10) / 10,
      distance,
      priceFrom,
      viewCount: currentViewCount + 1,
    };

    return {
      success: true,
      message: 'مشخصات آرایشگاه با موفقیت دریافت شد',
      data: overview,
    };
  } catch (error) {
    console.error('Error getting barbershop overview:', error);
    return {
      success: false,
      message: 'دریافت مشخصات آرایشگاه با خطا مواجه شد',
    };
  }
}

