import prisma from '../../../../All_Utils/config/prisma';
import {
  AddBookmarkRequest,
  AddBookmarkResponse,
  RemoveBookmarkRequest,
  RemoveBookmarkResponse,
  GetBookmarksResponse,
} from './bookmark.type';

/**
 * Add bookmark service
 */
export async function addBookmarkService(
  data: AddBookmarkRequest,
  customerId: number
): Promise<AddBookmarkResponse> {
  try {
    const { barbershopId } = data;

    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'آرایشگاه یافت نشد',
      };
    }

    // Check if already bookmarked
    const existingBookmark = await (prisma as any).bookmark?.findFirst({
      where: {
        customerId,
        barbershopId,
      },
    });

    if (existingBookmark) {
      return {
        success: false,
        message: 'این آرایشگاه قبلاً به لیست علاقه‌مندی‌ها اضافه شده است',
      };
    }

    // Create bookmark
    const bookmark = await (prisma as any).bookmark?.create({
      data: {
        customerId,
        barbershopId,
        created: BigInt(Date.now()) as any,
      },
    });

    return {
      success: true,
      message: 'آرایشگاه با موفقیت به لیست علاقه‌مندی‌ها اضافه شد',
      bookmarkId: bookmark?.id,
    };
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return {
      success: false,
      message: 'افزودن به لیست علاقه‌مندی‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Remove bookmark service
 */
export async function removeBookmarkService(
  data: RemoveBookmarkRequest,
  customerId: number
): Promise<RemoveBookmarkResponse> {
  try {
    const { barbershopId } = data;

    // Delete bookmark
    const result = await (prisma as any).bookmark?.deleteMany({
      where: {
        customerId,
        barbershopId,
      },
    });

    if (result?.count === 0) {
      return {
        success: false,
        message: 'این آرایشگاه در لیست علاقه‌مندی‌های شما نیست',
      };
    }

    return {
      success: true,
      message: 'آرایشگاه از لیست علاقه‌مندی‌ها حذف شد',
    };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return {
      success: false,
      message: 'حذف از لیست علاقه‌مندی‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Get bookmarks service
 */
export async function getBookmarksService(
  customerId: number,
  page: number = 1,
  limit: number = 20
): Promise<GetBookmarksResponse> {
  try {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      (prisma as any).bookmark?.findMany({
        where: {
          customerId,
        },
        include: {
          barbershop: {
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
            },
          },
        },
        orderBy: {
          created: 'desc',
        },
        skip,
        take: limit,
      }) || [],
      (prisma as any).bookmark?.count({
        where: {
          customerId,
        },
      }) || 0,
    ]);

    const formattedBookmarks = bookmarks.map((bookmark: any) => {
      const shop = bookmark.barbershop;
      
      // Calculate average rating
      const ratings = (shop.commentRates || [])
        .map((cr: any) => cr.rate)
        .filter((r: any): r is number => r !== null && r !== undefined);
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : shop.averageRating || 0;
      const ratingCount = ratings.length || shop.ratingCount || 0;

      // Calculate min price
      const prices = (shop.services || [])
        .map((s: any) => s.price)
        .filter((p: any): p is NonNullable<typeof p> => p !== null)
        .map((p: any) => Number(p));
      const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

      // Check if open
      const now = new Date();
      const currentDay = now.getDay();
      const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
      const todaySchedule = (shop.schedules || []).find((s: any) => s.weekday === currentDay);
      const isOpen = todaySchedule
        ? !todaySchedule.isClosed && currentMs >= todaySchedule.openMs && currentMs <= todaySchedule.closeMs
        : true;

      // Get discount percentage
      const discountPercentage = shop.publicMeta?.discountPercentage || shop.publicMeta?.discount || null;

      return {
        id: bookmark.id,
        barbershopId: bookmark.barbershopId,
        barbershop: {
          id: shop.id,
          name: shop.name,
          avatar: shop.avatar,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingCount,
          priceFrom,
          isOpen,
          discountPercentage,
        },
        createdAt: Number(bookmark.created),
      };
    });

    return {
      success: true,
      message: 'لیست علاقه‌مندی‌ها با موفقیت دریافت شد',
      bookmarks: formattedBookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return {
      success: false,
      message: 'دریافت لیست علاقه‌مندی‌ها با خطا مواجه شد',
    };
  }
}

