import prisma from '../../../All_Utils/config/prisma';
import { GetProfileResponse } from './profile.type';

/**
 * Get user profile service
 * SECURITY: Only returns profile data for the authenticated user (userId from JWT token)
 */
export async function getProfileService(userId: number): Promise<GetProfileResponse> {
  try {
    // SECURITY CHECK: Validate userId is a positive integer
    if (!userId || userId <= 0 || !Number.isInteger(userId)) {
      return {
        success: false,
        message: 'شناسه کاربر نامعتبر است',
      };
    }

    // Find customer by ID (ONLY the authenticated user's ID from JWT)
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        gender: true,
        publicMeta: true,
        role: true,
        last_login: true,
        created: true,
        updated: true,
      },
    });

    if (!customer) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    // Check if user is a barber (optional - skip if barbers table/column missing)
    let barber: { id: number } | null = null;
    try {
      barber = await prisma.barber.findFirst({
        where: { userRefId: customer.id },
        select: { id: true },
      });
    } catch {
      // barbers table or column may not exist
    }

    // Extract backgroundImage from publicMeta
    const publicMeta = (customer.publicMeta || {}) as any;
    const backgroundImage = publicMeta.backgroundImage || null;

    return {
      success: true,
      message: 'اطلاعات پروفایل با موفقیت دریافت شد',
      data: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: null, // Customer model doesn't have email field
        profileImage: customer.avatar,
        backgroundImage,
        role: customer.role as any,
        gender: customer.gender as 'male' | 'female' | 'other' | null,
        userType: barber ? 'barber' : 'customer',
        barberId: barber?.id,
        createdAt: (customer.created as Date).getTime(),
        updatedAt: (customer.updated as Date).getTime(),
      },
    };
  } catch (error) {
    console.error('Error getting profile:', error);
    return {
      success: false,
      message: 'دریافت اطلاعات پروفایل با خطا مواجه شد',
    };
  }
}

