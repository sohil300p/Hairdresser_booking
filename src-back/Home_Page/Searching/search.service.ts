import prisma from '../../config/prisma';
import { SearchRequest, SearchResponse, BarbershopSearchResult, ServiceSearchResult } from './search.type';

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
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

function isBarbershopOpen(
  schedules: Array<{ weekday: number; openMs: number; closeMs: number; isClosed: boolean }>,
  openingTime?: string | null,
  closingTime?: string | null
): boolean {
  const now = new Date();
  const currentDay = now.getDay();
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

export async function searchService(
  params: SearchRequest
): Promise<SearchResponse> {
  try {
    const { query, lat, lng, radius, page = 1, limit = 20 } = params;

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        message: 'عبارت جستجو الزامی است',
      };
    }

    const searchTerm = query.trim();

    const skip = (page - 1) * limit;

    const [barbershops, services, barbershopsCount, servicesCount] = await Promise.all([
      prisma.barbershop.findMany({
        where: {
          active: true,
          name: {
            contains: searchTerm,
          },
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
        },
        skip,
        take: limit,
      }),
      prisma.service.findMany({
        where: {
          name: {
            contains: searchTerm,
          },
          barbershop: {
            active: true,
          },
        },
        include: {
          barbershop: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.barbershop.count({
        where: {
          active: true,
          name: {
            contains: searchTerm,
          },
        },
      }),
      prisma.service.count({
        where: {
          name: {
            contains: searchTerm,
          },
          barbershop: {
            active: true,
          },
        },
      }),
    ]);

    const barbershopResults: BarbershopSearchResult[] = (barbershops as any[]).map((shop) => {
      let distance: number | undefined;
      if (lat !== undefined && lng !== undefined && shop.latitude && shop.longitude) {
        distance = calculateDistance(
          lat,
          lng,
          Number(shop.latitude),
          Number(shop.longitude)
        );
      }

      const ratings = (shop.commentRates || [])
        .map((cr: any) => cr.rate)
        .filter((r: any): r is number => r !== null && r !== undefined);
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : shop.averageRating || 0;
      const ratingCount = ratings.length || shop.ratingCount || 0;

      const prices = (shop.services || [])
        .map((s: any) => s.price)
        .filter((p: any): p is NonNullable<typeof p> => p !== null)
        .map((p: any) => Number(p));
      const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

      const isOpen = isBarbershopOpen(shop.schedules || [], shop.openingTime, shop.closingTime);
      const discountPercentage = shop.publicMeta ? getDiscountPercentage(shop.publicMeta as any) : null;

      return {
        id: shop.id,
        name: shop.name,
        avatar: shop.avatar,
        address: shop.address,
        city: shop.city,
        neighborhood: shop.neighborhood,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
        priceFrom,
        isOpen,
        distance,
        discountPercentage,
      };
    });

    let filteredBarbershops = barbershopResults;
    if (radius !== undefined && lat !== undefined && lng !== undefined) {
      filteredBarbershops = barbershopResults.filter(
        (shop) => shop.distance !== undefined && shop.distance <= radius
      );
    }

    if (lat !== undefined && lng !== undefined) {
      filteredBarbershops.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return (b.averageRating || 0) - (a.averageRating || 0);
      });
    } else {
      filteredBarbershops.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    const serviceResults: ServiceSearchResult[] = (services as any[]).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price ? Number(service.price) : null,
      estimatedTime: service.estimatedTime,
      barbershopId: service.barbershopId,
      barbershopName: service.barbershop?.name || 'نامشخص',
      barbershopAvatar: service.barbershop?.avatar || null,
      gender: service.gender,
      isVip: service.isVip,
    }));

    const total = barbershopsCount + servicesCount;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'نتایج جستجو با موفقیت دریافت شد',
      data: {
        barbershops: filteredBarbershops,
        services: serviceResults,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error in search service:', error);
    return {
      success: false,
      message: 'جستجو با خطا مواجه شد',
    };
  }
}

