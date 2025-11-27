import prisma from '../../../All_Utils/config/prisma';
import { 
  EditBarberProfileRequest, 
  EditBarberProfileResponse
} from './editprofile.type';
import { minioClient, DEFAULT_BUCKET, minioConfig } from '../../../All_Utils/config/minio';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to extract object name from URL
 */
function extractObjectNameFromUrl(url: string): string | null {
  try {
    if (!url) return null;
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part !== '');
    if (pathParts.length >= 2) {
      return pathParts.slice(1).join('/');
    } else if (pathParts.length === 1) {
      return pathParts[0];
    }
    return null;
  } catch (error) {
    console.error('Error extracting object name from URL:', error);
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
 * Helper function to delete file from MinIO
 */
async function deleteFileService(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(DEFAULT_BUCKET, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
  }
}

/**
 * Edit barber profile service
 * Updates barbershop info (name, gender, address, description, images)
 */
export async function editBarberProfileService(
  barberId: number,
  data: EditBarberProfileRequest,
  profileImageFile?: Express.Multer.File,
  backgroundImageFile?: Express.Multer.File
): Promise<EditBarberProfileResponse> {
  try {
    // Find barber and barbershop
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        ownedBarbershops: {
          select: {
            id: true,
            name: true,
            avatar: true,
            publicMeta: true,
          },
          take: 1,
        },
      },
    });

    if (!barber) {
      return {
        success: false,
        message: 'آرایشگر یافت نشد',
      };
    }

    const barbershop = barber.ownedBarbershops[0];

    if (!barbershop) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    // Upload profile image if provided
    let profileImageUrl = barbershop.avatar;
    if (profileImageFile) {
      const fileExtension = profileImageFile.originalname.split('.').pop();
      const fileName = `barbershop-profiles/${uuidv4()}.${fileExtension}`;

      await minioClient.putObject(DEFAULT_BUCKET, fileName, profileImageFile.buffer, profileImageFile.size, {
        'Content-Type': profileImageFile.mimetype,
      });

      profileImageUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${fileName}`;

      // Delete old profile image if exists
      if (barbershop.avatar) {
        const oldObjectName = extractObjectNameFromUrl(barbershop.avatar);
        if (oldObjectName) {
          await deleteFileService(oldObjectName);
        }
      }
    }

    // Upload background image if provided
    const existingPublicMeta = (barbershop.publicMeta || {}) as any;
    let backgroundImageUrl = existingPublicMeta.backgroundImage || existingPublicMeta.background || null;

    if (backgroundImageFile) {
      const fileExtension = backgroundImageFile.originalname.split('.').pop();
      const fileName = `barbershop-backgrounds/${uuidv4()}.${fileExtension}`;

      await minioClient.putObject(DEFAULT_BUCKET, fileName, backgroundImageFile.buffer, backgroundImageFile.size, {
        'Content-Type': backgroundImageFile.mimetype,
      });

      backgroundImageUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${fileName}`;

      // Delete old background image if exists
      if (existingPublicMeta.backgroundImage) {
        const oldObjectName = extractObjectNameFromUrl(existingPublicMeta.backgroundImage);
        if (oldObjectName) {
          await deleteFileService(oldObjectName);
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated: BigInt(Date.now()),
    };

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }

    if (data.address !== undefined) {
      updateData.address = data.address.trim() || null;
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    if (profileImageUrl !== barbershop.avatar) {
      updateData.avatar = profileImageUrl;
    }

    // Update publicMeta with backgroundImage
    if (backgroundImageUrl !== (existingPublicMeta.backgroundImage || existingPublicMeta.background)) {
      updateData.publicMeta = {
        ...existingPublicMeta,
        backgroundImage: backgroundImageUrl,
      };
    }

    // Update barbershop
    const updatedBarbershop = await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        gender: true,
        address: true,
        description: true,
        avatar: true,
        publicMeta: true,
      },
    });

    const updatedPublicMeta = (updatedBarbershop.publicMeta || {}) as any;
    const finalBackgroundImage = updatedPublicMeta.backgroundImage || updatedPublicMeta.background || null;

    return {
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: {
        barbershop: {
          id: updatedBarbershop.id,
          name: updatedBarbershop.name,
          gender: updatedBarbershop.gender as 'male' | 'female' | 'unisex',
          address: updatedBarbershop.address,
          description: updatedBarbershop.description,
          profileImage: updatedBarbershop.avatar,
          backgroundImage: finalBackgroundImage,
        },
      },
    };
  } catch (error) {
    console.error('Error editing barber profile:', error);
    return {
      success: false,
      message: 'به‌روزرسانی پروفایل با خطا مواجه شد',
    };
  }
}

