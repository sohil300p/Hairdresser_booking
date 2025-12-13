import prisma from '../../../All_Utils/config/prisma';
import { 
  GetBarberProfileResponse, 
  CreateBarberProfileRequest,
  CreateBarberProfileResponse
} from './profile.type';
import { minioClient, DEFAULT_BUCKET, minioConfig } from '../../../All_Utils/config/minio';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert milliseconds to HH:mm format
 */
function msToTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get barber profile service
 * Returns barbershop info, services, and schedules
 */
export async function getBarberProfileService(barberId: number): Promise<GetBarberProfileResponse> {
  try {
    // Find barber
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        ownedBarbershops: {
          select: {
            id: true,
            name: true,
            gender: true,
            address: true,
            description: true,
            avatar: true,
            publicMeta: true,
            services: {
              where: {
                parentServiceId: null, // Only top-level services
              },
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                estimatedTime: true,
                files: true,
                avatar: true,
              },
              orderBy: {
                created: 'asc',
              },
            },
            schedules: {
              select: {
                weekday: true,
                openMs: true,
                closeMs: true,
                isClosed: true,
              },
              orderBy: {
                weekday: 'asc',
              },
            },
          },
          take: 1, // Get first barbershop (assuming one barber has one barbershop)
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

    // Extract backgroundImage from publicMeta
    const publicMeta = (barbershop.publicMeta || {}) as any;
    const backgroundImage = publicMeta.backgroundImage || publicMeta.background || null;

    // Format services
    const services = (barbershop.services || []).map((service: any) => {
      const files = (service.files || []) as string[];
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price ? Number(service.price) : null,
        estimatedTime: service.estimatedTime,
        images: Array.isArray(files) ? files : [],
        avatar: service.avatar,
      };
    });

    // Format schedules
    const schedules = (barbershop.schedules || []).map((schedule: any) => ({
      weekday: schedule.weekday,
      openTime: msToTime(schedule.openMs),
      closeTime: msToTime(schedule.closeMs),
      isClosed: schedule.isClosed,
    }));

    return {
      success: true,
      message: 'اطلاعات پروفایل با موفقیت دریافت شد',
      data: {
        barbershop: {
          id: barbershop.id,
          name: barbershop.name,
          gender: barbershop.gender as 'male' | 'female' | 'unisex',
          address: barbershop.address,
          description: barbershop.description,
          profileImage: barbershop.avatar,
          backgroundImage,
        },
        services,
        schedules,
      },
    };
  } catch (error) {
    console.error('Error getting barber profile:', error);
    return {
      success: false,
      message: 'دریافت اطلاعات پروفایل با خطا مواجه شد',
    };
  }
}

/**
 * Create barber profile service (first time setup)
 * Creates a new barbershop for the barber
 */
export async function createBarberProfileService(
  barberId: number,
  data: CreateBarberProfileRequest,
  profileImageFile?: Express.Multer.File,
  backgroundImageFile?: Express.Multer.File
): Promise<CreateBarberProfileResponse> {
  try {
    // Check if barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        ownedBarbershops: {
          select: {
            id: true,
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

    // Check if barber already has a barbershop
    if (barber.ownedBarbershops.length > 0) {
      return {
        success: false,
        message: 'شما قبلاً سالن آرایشگاه خود را ثبت کرده‌اید. برای ویرایش از API ویرایش استفاده کنید',
      };
    }

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: 'نام سالن الزامی است',
      };
    }

    if (!data.gender) {
      return {
        success: false,
        message: 'جنسیت سالن الزامی است',
      };
    }

    // Upload profile image if provided
    let profileImageUrl: string | null = null;
    if (profileImageFile) {
      const fileExtension = profileImageFile.originalname.split('.').pop();
      const fileName = `barbershop-profiles/${uuidv4()}.${fileExtension}`;

      await minioClient.putObject(DEFAULT_BUCKET, fileName, profileImageFile.buffer, profileImageFile.size, {
        'Content-Type': profileImageFile.mimetype,
      });

      profileImageUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${fileName}`;
    }

    // Upload background image if provided
    let backgroundImageUrl: string | null = null;
    if (backgroundImageFile) {
      const fileExtension = backgroundImageFile.originalname.split('.').pop();
      const fileName = `barbershop-backgrounds/${uuidv4()}.${fileExtension}`;

      await minioClient.putObject(DEFAULT_BUCKET, fileName, backgroundImageFile.buffer, backgroundImageFile.size, {
        'Content-Type': backgroundImageFile.mimetype,
      });

      backgroundImageUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${fileName}`;
    }

    // Prepare publicMeta
    const publicMeta: any = {};
    if (backgroundImageUrl) {
      publicMeta.backgroundImage = backgroundImageUrl;
    }

    // Create barbershop
    const barbershop = await prisma.barbershop.create({
      data: {
        ownerId: barberId,
        name: data.name.trim(),
        gender: data.gender,
        address: data.address?.trim() || null,
        description: data.description?.trim() || null,
        city: data.city?.trim() || null,
        neighborhood: data.neighborhood?.trim() || null,
        latitude: data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== undefined ? data.longitude : null,
        avatar: profileImageUrl,
        publicMeta: Object.keys(publicMeta).length > 0 ? publicMeta : null,
        type: 'fixed', // Default type
        active: true,
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
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

    // Create wallet for new barbershop
    try {
      const { ensureBarbershopWallet } = await import('../../../All_Utils/Wallet/wallet.utils');
      await ensureBarbershopWallet(barbershop.id);
    } catch (error) {
      console.error('⚠️ Failed to create wallet for new barbershop:', error);
      // Don't fail the profile creation if wallet creation fails
    }

    const finalPublicMeta = (barbershop.publicMeta || {}) as any;
    const finalBackgroundImage = finalPublicMeta.backgroundImage || null;

    return {
      success: true,
      message: 'پروفایل با موفقیت ایجاد شد',
      data: {
        barbershop: {
          id: barbershop.id,
          name: barbershop.name,
          gender: barbershop.gender as 'male' | 'female' | 'unisex',
          address: barbershop.address,
          description: barbershop.description,
          profileImage: barbershop.avatar,
          backgroundImage: finalBackgroundImage,
        },
      },
    };
  } catch (error) {
    console.error('Error creating barber profile:', error);
    return {
      success: false,
      message: 'ایجاد پروفایل با خطا مواجه شد',
    };
  }
}
