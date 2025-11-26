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
        publicMeta: true,
        role: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    // Check if user is a barber
    const barber = await prisma.barber.findFirst({
      where: { userRefId: customer.id },
    });

    // Extract backgroundImage from publicMeta
    const publicMeta = (customer.publicMeta || {}) as any;
    const backgroundImage = publicMeta.backgroundImage || null;

    return {
      success: true,
      message: 'اطلاعات پروفایل با موفقیت دریافت شد',
      data: {
        id: customer.id,
        firstName: customer.fullName?.split(' ')[0] || null,
        lastName: customer.fullName?.split(' ').slice(1).join(' ') || null,
        phone: customer.phone,
        email: null, // Customer model doesn't have email field
        profileImage: customer.avatar,
        backgroundImage,
        role: customer.role as any,
        gender: customer.gender as any,
        userType: barber ? 'barber' : 'customer',
        barberId: barber?.id,
        createdAt: Number(customer.createdAt),
        updatedAt: Number(customer.updatedAt),
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

