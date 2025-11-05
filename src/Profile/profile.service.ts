import prisma from '../config/prisma';
import { GetProfileResponse } from './profile.type';

/**
 * Get user profile service
 */
export async function getProfileService(userId: number): Promise<GetProfileResponse> {
  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    return {
      success: true,
      message: 'اطلاعات پروفایل با موفقیت دریافت شد',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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

