import prisma from '../../../All_Utils/config/prisma';
import {
  GetCommentsResponse,
  CommentItem
} from './comment.type';

/**
 * Get customer comments for barber
 */
export async function getCommentsService(barbershopId: number): Promise<GetCommentsResponse> {
  try {
    // Get all comments for this barbershop
    const comments = await prisma.commentRate.findMany({
      where: {
        barbershopId,
        parentCommentId: null, // Only top-level comments
      },
      select: {
        id: true,
        comment: true,
        rate: true,
        serviceId: true,
        appointmentId: true,
        created: true,
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        created: 'desc',
      },
    });

    // Format comments
    const formattedComments: CommentItem[] = comments.map((comment) => ({
      id: comment.id,
      customerName: comment.customer?.fullName || null,
      customerAvatar: comment.customer?.avatar || null,
      comment: comment.comment,
      rate: comment.rate,
      serviceId: comment.serviceId,
      serviceName: comment.service?.name || null,
      appointmentStartTime: comment.appointment?.startTime ? Number(comment.appointment.startTime) : null,
      appointmentEndTime: comment.appointment?.endTime ? Number(comment.appointment.endTime) : null,
      createdAt: Number(comment.created),
    }));

    // Calculate average rating
    const ratings = comments
      .map((c) => c.rate)
      .filter((r): r is number => r !== null && r !== undefined);
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      success: true,
      message: 'نظرات مشتریان با موفقیت دریافت شد',
      data: {
        comments: formattedComments,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalComments: formattedComments.length,
      },
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    return {
      success: false,
      message: 'دریافت نظرات با خطا مواجه شد',
    };
  }
}

