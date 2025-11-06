import prisma from '../config/prisma';
import { EditProfileResponse, EditProfileRequest } from './profile.type';
import { uploadFileService, deleteFileService } from '../files_minIO/files.service';

/**
 * Extract file name from MinIO URL
 * URL format: http://localhost:9000/bucket-name/folder/file-name.ext
 * Returns: folder/file-name.ext or file-name.ext
 */
function extractFileNameFromUrl(url: string): string | null {
  try {
    if (!url) return null;
    
    // Parse URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part !== '');
    
    // Path format: [bucket-name, folder?, file-name.ext]
    // We need everything after bucket name
    if (pathParts.length >= 2) {
      // Skip bucket name, return the rest (folder/file-name.ext)
      return pathParts.slice(1).join('/');
    } else if (pathParts.length === 1) {
      // Only file name, no folder
      return pathParts[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file name from URL:', error);
    // Fallback: try simple string split
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('barber') || part.includes('uploads'));
      if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return urlParts[urlParts.length - 1] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Edit user profile service
 */
export async function editProfileService(
  userId: number,
  data: EditProfileRequest,
  profileImageFile?: Express.Multer.File
): Promise<EditProfileResponse> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    // Prepare update data
    const updateData: {
      firstName?: string | null;
      lastName?: string | null;
      profileImage?: string | null;
    } = {};

    // Update firstName if provided
    if (data.firstName !== undefined) {
      const trimmedFirstName = data.firstName.trim();
      updateData.firstName = trimmedFirstName === '' ? null : trimmedFirstName;
    }

    // Update lastName if provided
    if (data.lastName !== undefined) {
      const trimmedLastName = data.lastName.trim();
      updateData.lastName = trimmedLastName === '' ? null : trimmedLastName;
    }

    // Handle profile image upload if file is provided
    if (profileImageFile) {
      const uploadResult = await uploadFileService(profileImageFile, 'profiles');
      
      if (!uploadResult.success || !uploadResult.fileUrl) {
        return {
          success: false,
          message: 'آپلود عکس پروفایل با خطا مواجه شد',
        };
      }

      // Delete old profile image if exists
      if (existingUser.profileImage) {
        try {
          const oldFileName = extractFileNameFromUrl(existingUser.profileImage);
          if (oldFileName) {
            // Extract folder name (profiles)
            const folder = oldFileName.includes('/') ? oldFileName.split('/')[0] : undefined;
            const fileName = oldFileName.includes('/') ? oldFileName.split('/').slice(1).join('/') : oldFileName;
            
            await deleteFileService(fileName, folder);
          }
        } catch (error) {
          console.error('Error deleting old profile image:', error);
          // Continue with update even if deletion fails
        }
      }

      updateData.profileImage = uploadResult.fileUrl;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است',
      };
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return {
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error editing profile:', error);
    return {
      success: false,
      message: 'به‌روزرسانی پروفایل با خطا مواجه شد',
    };
  }
}

