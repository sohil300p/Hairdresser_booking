import prisma from '../../config/prisma';
import { EditProfileResponse, EditProfileRequest } from './profile.type';
import { minioClient, DEFAULT_BUCKET } from '../../config/minio';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file to MinIO
 */
async function uploadFileService(file: Express.Multer.File, folder?: string): Promise<{ success: boolean; fileUrl?: string; message?: string }> {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const objectName = folder ? `${folder}/${fileName}` : fileName;

    await minioClient.putObject(DEFAULT_BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const fileUrl = `${process.env.MINIO_ENDPOINT || 'http://localhost'}:${process.env.MINIO_PORT || '9000'}/${DEFAULT_BUCKET}/${objectName}`;

    return {
      success: true,
      fileUrl,
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    return {
      success: false,
      message: 'خطا در آپلود فایل',
    };
  }
}

/**
 * Delete file from MinIO
 */
async function deleteFileService(fileName: string, folder?: string): Promise<void> {
  try {
    const objectName = folder ? `${folder}/${fileName}` : fileName;
    await minioClient.removeObject(DEFAULT_BUCKET, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
}

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
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!existingCustomer) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    // Prepare update data
    const updateData: {
      fullName?: string | null;
      avatar?: string | null;
    } = {};

    // Update fullName if firstName or lastName provided
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName?.trim() || '';
      const lastName = data.lastName?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      updateData.fullName = fullName === '' ? null : fullName;
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
      if (existingCustomer.avatar) {
        try {
          const oldFileName = extractFileNameFromUrl(existingCustomer.avatar);
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

      updateData.avatar = uploadResult.fileUrl;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است',
      };
    }

    // Update customer profile
    
    const updatedCustomer = await prisma.customer.update({
      where: { id: userId },
      data: {
        ...updateData,
        updated: BigInt(Date.now()),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        gender: true,
        created: true,
        updated: true,
      },
    });

    return {
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: {
        id: updatedCustomer.id,
        firstName: updatedCustomer.fullName?.split(' ')[0] || null,
        lastName: updatedCustomer.fullName?.split(' ').slice(1).join(' ') || null,
        phone: updatedCustomer.phone,
        email: updatedCustomer.email,
        profileImage: updatedCustomer.avatar,
        role: updatedCustomer.role as any,
        gender: updatedCustomer.gender as any,
        createdAt: Number(updatedCustomer.created),
        updatedAt: Number(updatedCustomer.updated),
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

