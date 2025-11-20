import prisma from '../../config/prisma';
import {
  GetBarbershopDetailsRequest,
  GetBarbershopDetailsResponse,
  CommentItem,
  GalleryImage,
} from './barbershop-details.type';

/**
 * Get barbershop details (description, comments, gallery) with action (increment view count)
 */
export async function getBarbershopDetailsService(
  params: GetBarbershopDetailsRequest
): Promise<GetBarbershopDetailsResponse> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Get barbershop
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: params.barbershopId },
      select: {
        id: true,
        description: true,
        publicMeta: true,
        commentRates: {
          where: {
            barbershopId: params.barbershopId,
            parentCommentId: null, // Only top-level comments
          },
          include: {
            customer: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                customer: {
                  select: {
                    fullName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                created: 'asc',
              },
            },
          },
          orderBy: {
            created: 'desc',
          },
          skip,
          take: limit,
        },
        services: {
          select: {
            files: true,
            avatar: true,
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

    // Increment details view count (action in database)
    const shop = barbershop as any;
    const publicMeta = (shop.publicMeta || {}) as any;
    const currentViewCount = typeof publicMeta.detailsViewCount === 'number' ? publicMeta.detailsViewCount : 0;
    
    await prisma.barbershop.update({
      where: { id: params.barbershopId },
      data: {
        publicMeta: {
          ...publicMeta,
          detailsViewCount: currentViewCount + 1,
          lastDetailsViewedAt: Date.now(),
        },
        updated: BigInt(Date.now()),
      },
    });

    // Get total comments count
    const totalComments = await prisma.commentRate.count({
      where: {
        barbershopId: params.barbershopId,
        parentCommentId: null,
      },
    });

    // Get all ratings for average calculation
    const allRatings = await prisma.commentRate.findMany({
      where: {
        barbershopId: params.barbershopId,
        rate: {
          not: null,
        },
      },
      select: {
        rate: true,
      },
    });

    const ratings = allRatings
      .map((cr) => cr.rate)
      .filter((r): r is number => r !== null && r !== undefined);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    // Format comments
    const formatComment = (comment: any): CommentItem => {
      const replies = (comment.replies || []).map((reply: any) => formatComment(reply));
      return {
        id: comment.id,
        customerName: comment.customer?.fullName || null,
        customerAvatar: comment.customer?.avatar || null,
        comment: comment.comment,
        rate: comment.rate,
        createdAt: Number(comment.created),
        replies: replies.length > 0 ? replies : undefined,
      };
    };

    const comments: CommentItem[] = (shop.commentRates || []).map((comment: any) => formatComment(comment));

    // Extract gallery images from services and publicMeta
    const gallery: GalleryImage[] = [];
    
    // From publicMeta
    if (publicMeta.gallery && Array.isArray(publicMeta.gallery)) {
      publicMeta.gallery.forEach((item: any) => {
        if (typeof item === 'string') {
          gallery.push({ url: item, type: 'image' });
        } else if (item && item.url) {
          gallery.push({
            url: item.url,
            type: item.type || 'image',
            thumbnail: item.thumbnail,
          });
        }
      });
    }

    // From services files
    (shop.services || []).forEach((service: any) => {
      if (service.files) {
        const files = Array.isArray(service.files) ? service.files : [service.files];
        files.forEach((file: any) => {
          if (typeof file === 'string') {
            gallery.push({ url: file, type: 'image' });
          } else if (file && file.url) {
            gallery.push({
              url: file.url,
              type: file.type || 'image',
              thumbnail: file.thumbnail,
            });
          }
        });
      }
      if (service.avatar) {
        gallery.push({ url: service.avatar, type: 'image' });
      }
    });

    // Remove duplicates
    const uniqueGallery = gallery.filter((item, index, self) =>
      index === self.findIndex((t) => t.url === item.url)
    );

    return {
      success: true,
      message: 'جزئیات آرایشگاه با موفقیت دریافت شد',
      data: {
        description: shop.description,
        comments,
        gallery: uniqueGallery,
        totalComments,
        averageRating: Math.round(averageRating * 10) / 10,
        viewCount: currentViewCount + 1,
      },
    };
  } catch (error) {
    console.error('Error getting barbershop details:', error);
    return {
      success: false,
      message: 'دریافت جزئیات آرایشگاه با خطا مواجه شد',
    };
  }
}

