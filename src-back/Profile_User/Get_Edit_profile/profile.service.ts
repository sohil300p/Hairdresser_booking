import prisma from '../../config/prisma';
import { GetProfileResponse } from './profile.type';

/**
 * Get user profile service
 */
export async function getProfileService(userId: number): Promise<GetProfileResponse> {
  try {
    // Find customer by ID
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatar: true,
        publicMeta: true,
        role: true,
        gender: true,
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
        email: customer.email,
        profileImage: customer.avatar,
        backgroundImage,
        role: customer.role as any,
        gender: customer.gender as any,
        userType: barber ? 'barber' : 'customer',
        barberId: barber?.id,
        createdAt: Number(customer.created),
        updatedAt: Number(customer.updated),
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

