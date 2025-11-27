import prisma from '../../../All_Utils/config/prisma';
import { EditProfileResponse, EditProfileRequest } from './profile.type';
import { minioClient, DEFAULT_BUCKET, minioConfig } from '../../../All_Utils/config/minio';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file to MinIO
 */
async function uploadFileService(file: Express.Multer.File, folder?: string): Promise<{ success: boolean; fileUrl?: string; message?: string }> {
  try {
    // Validate file
    if (!file || !file.buffer || !file.originalname) {
      console.error('Invalid file object:', { hasFile: !!file, hasBuffer: !!file?.buffer, hasOriginalName: !!file?.originalname });
      return {
        success: false,
        message: 'فایل نامعتبر است',
      };
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const objectName = folder ? `${folder}/${fileName}` : fileName;

    console.log(`📤 Uploading file to MinIO: ${objectName} (${file.size} bytes)`);

    await minioClient.putObject(DEFAULT_BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype || 'image/jpeg',
    });

    const fileUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${objectName}`;
    console.log(`✅ File uploaded successfully: ${fileUrl}`);

    return {
      success: true,
      fileUrl,
    };
  } catch (error) {
    console.error('❌ Error uploading file to MinIO:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `خطا در آپلود فایل: ${errorMessage}`,
    };
  }
}

/**
 * Delete file from MinIO
 */
async function deleteFileService(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(DEFAULT_BUCKET, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    // Don't throw - just log the error
  }
}

/**
 * Extract object name from MinIO URL
 * URL format: http://localhost:9000/bucket-name/folder/file-name.ext
 * Returns: folder/file-name.ext or file-name.ext (object name in MinIO)
 */
function extractObjectNameFromUrl(url: string): string | null {
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
    console.error('Error extracting object name from URL:', error);
    // Fallback: try simple string split
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === DEFAULT_BUCKET || part.includes('barber') || part.includes('uploads'));
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
  profileImageFile?: Express.Multer.File,
  backgroundImageFile?: Express.Multer.File
): Promise<EditProfileResponse> {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        publicMeta: true,
      },
    });

    if (!existingCustomer) {
      return {
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    // Check if profile is already completed (name exists)
    const isProfileCompleted = existingCustomer.fullName;

    // If profile is completed, prevent changes to name
    if (isProfileCompleted) {
      if (data.fullName !== undefined) {
        return {
          success: false,
          message: 'امکان تغییر نام پس از تکمیل پروفایل وجود ندارد',
        };
      }
    }

    // Prepare update data
    const updateData: {
      fullName?: string | null;
      avatar?: string | null;
      publicMeta?: any;
    } = {};

    // Get existing publicMeta
    const existingPublicMeta = (existingCustomer.publicMeta || {}) as any;

    // Update fullName if provided
    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim();
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
        const oldObjectName = extractObjectNameFromUrl(existingCustomer.avatar);
        if (oldObjectName) {
          await deleteFileService(oldObjectName);
        }
      }

      updateData.avatar = uploadResult.fileUrl;
    }

    // Handle background image upload if file is provided
    if (backgroundImageFile) {
      const uploadResult = await uploadFileService(backgroundImageFile, 'backgrounds');
      
      if (!uploadResult.success || !uploadResult.fileUrl) {
        return {
          success: false,
          message: 'آپلود عکس بک‌گراند با خطا مواجه شد',
        };
      }

      // Delete old background image if exists
      if (existingPublicMeta.backgroundImage) {
        const oldObjectName = extractObjectNameFromUrl(existingPublicMeta.backgroundImage);
        if (oldObjectName) {
          await deleteFileService(oldObjectName);
        }
      }

      // Update publicMeta with new backgroundImage
      updateData.publicMeta = {
        ...existingPublicMeta,
        backgroundImage: uploadResult.fileUrl,
      };
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
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        publicMeta: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Extract backgroundImage from updated publicMeta
    const updatedPublicMeta = (updatedCustomer.publicMeta || {}) as any;
    const backgroundImage = updatedPublicMeta.backgroundImage || null;

    return {
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: {
        id: updatedCustomer.id,
        fullName: updatedCustomer.fullName,
        phone: updatedCustomer.phone,
        profileImage: updatedCustomer.avatar,
        backgroundImage,
        role: updatedCustomer.role as any,
        createdAt: updatedCustomer.createdAt.toISOString(),
        updatedAt: updatedCustomer.updatedAt.toISOString(),
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

