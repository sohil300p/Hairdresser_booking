import prisma from '../../../All_Utils/config/prisma';
import {
  GetServicesResponse,
  CreateServiceRequest,
  CreateServiceResponse,
  EditServiceRequest,
  EditServiceResponse,
  ServiceItem
} from './service.type';
import { minioClient, DEFAULT_BUCKET, minioConfig } from '../../../All_Utils/config/minio';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helper function to upload file to MinIO
 */
async function uploadFileService(file: Express.Multer.File, folder?: string): Promise<{ success: boolean; fileUrl?: string; message?: string }> {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const objectName = folder ? `${folder}/${fileName}` : fileName;

    await minioClient.putObject(DEFAULT_BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const fileUrl = `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${objectName}`;

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
 * Get all services for barbershop
 */
export async function getServicesService(barbershopId: number): Promise<GetServicesResponse> {
  try {
    const services = await prisma.service.findMany({
      where: {
        barbershopId,
        parentServiceId: null, // Only top-level services
      },
      select: {
        id: true,
        name: true,
        price: true,
        estimatedTime: true,
        description: true,
        avatar: true,
        files: true,
        gender: true,
        isVip: true,
        isMedical: true,
        parentServiceId: true,
        created: true,
        updated: true,
      },
      orderBy: {
        created: 'asc',
      },
    });

    const formattedServices: ServiceItem[] = services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price ? Number(service.price) : null,
      estimatedTime: service.estimatedTime,
      description: service.description,
      avatar: service.avatar,
      files: Array.isArray(service.files) ? (service.files as string[]) : [],
      gender: service.gender as 'male' | 'female' | 'other',
      isVip: service.isVip,
      isMedical: service.isMedical,
      parentServiceId: service.parentServiceId,
      createdAt: Number(service.created),
      updatedAt: Number(service.updated),
    }));

    return {
      success: true,
      message: 'لیست سرویس‌ها با موفقیت دریافت شد',
      data: {
        services: formattedServices,
      },
    };
  } catch (error) {
    console.error('Error getting services:', error);
    return {
      success: false,
      message: 'دریافت سرویس‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Create new service
 */
export async function createServiceService(
  barbershopId: number,
  data: CreateServiceRequest,
  avatarFile?: Express.Multer.File,
  sampleImageFiles?: Express.Multer.File[]
): Promise<CreateServiceResponse> {
  try {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: 'نام سرویس الزامی است',
      };
    }

    if (!data.estimatedTime || data.estimatedTime <= 0) {
      return {
        success: false,
        message: 'زمان تخمینی سرویس باید بیشتر از صفر باشد',
      };
    }

    if (!data.gender) {
      return {
        success: false,
        message: 'جنسیت سرویس الزامی است',
      };
    }

    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      };
    }

    // Upload avatar if provided
    let avatarUrl: string | null = null;
    if (avatarFile) {
      const uploadResult = await uploadFileService(avatarFile, 'service-avatars');
      if (!uploadResult.success || !uploadResult.fileUrl) {
        return { success: false, message: uploadResult.message || 'آپلود عکس آواتار با خطا مواجه شد' };
      }
      avatarUrl = uploadResult.fileUrl;
    }

    // Upload sample images if provided
    const files: string[] = [];
    if (sampleImageFiles && sampleImageFiles.length > 0) {
      for (const file of sampleImageFiles) {
        const uploadResult = await uploadFileService(file, 'service-samples');
        if (uploadResult.success && uploadResult.fileUrl) {
          files.push(uploadResult.fileUrl);
        }
      }
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        barbershopId,
        name: data.name.trim(),
        price: data.price !== undefined ? new Decimal(data.price) : null,
        estimatedTime: data.estimatedTime,
        description: data.description?.trim() || null,
        gender: data.gender as any,
        isVip: data.isVip || false,
        isMedical: data.isMedical || false,
        parentServiceId: data.parentServiceId || null,
        avatar: avatarUrl,
        files: files.length > 0 ? files : null,
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
      select: {
        id: true,
        name: true,
        price: true,
        estimatedTime: true,
        description: true,
        avatar: true,
        files: true,
        gender: true,
        isVip: true,
        isMedical: true,
        parentServiceId: true,
        created: true,
        updated: true,
      },
    });

    const formattedService: ServiceItem = {
      id: service.id,
      name: service.name,
      price: service.price ? Number(service.price) : null,
      estimatedTime: service.estimatedTime,
      description: service.description,
      avatar: service.avatar,
      files: Array.isArray(service.files) ? (service.files as string[]) : [],
      gender: service.gender as 'male' | 'female' | 'other',
      isVip: service.isVip,
      isMedical: service.isMedical,
      parentServiceId: service.parentServiceId,
      createdAt: Number(service.created),
      updatedAt: Number(service.updated),
    };

    return {
      success: true,
      message: 'سرویس با موفقیت ایجاد شد',
      data: {
        service: formattedService,
      },
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return {
      success: false,
      message: 'ایجاد سرویس با خطا مواجه شد',
    };
  }
}

/**
 * Edit service
 */
export async function editServiceService(
  serviceId: number,
  barbershopId: number,
  data: EditServiceRequest,
  avatarFile?: Express.Multer.File,
  sampleImageFiles?: Express.Multer.File[]
): Promise<EditServiceResponse> {
  try {
    // Check if service exists and belongs to barbershop
    const existingService = await prisma.service.findFirst({
      where: {
        id: serviceId,
        barbershopId,
      },
      select: {
        id: true,
        avatar: true,
        files: true,
      },
    });

    if (!existingService) {
      return {
        success: false,
        message: 'سرویس یافت نشد',
      };
    }

    // Upload new avatar if provided
    let avatarUrl = existingService.avatar;
    if (avatarFile) {
      const uploadResult = await uploadFileService(avatarFile, 'service-avatars');
      if (!uploadResult.success || !uploadResult.fileUrl) {
        return { success: false, message: uploadResult.message || 'آپلود عکس آواتار با خطا مواجه شد' };
      }
      avatarUrl = uploadResult.fileUrl;
    }

    // Upload new sample images if provided
    let files: string[] = Array.isArray(existingService.files) ? (existingService.files as string[]) : [];
    if (sampleImageFiles && sampleImageFiles.length > 0) {
      for (const file of sampleImageFiles) {
        const uploadResult = await uploadFileService(file, 'service-samples');
        if (uploadResult.success && uploadResult.fileUrl) {
          files.push(uploadResult.fileUrl);
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

    if (data.price !== undefined) {
      updateData.price = data.price !== null ? new Decimal(data.price) : null;
    }

    if (data.estimatedTime !== undefined) {
      updateData.estimatedTime = data.estimatedTime;
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender as any;
    }

    if (data.isVip !== undefined) {
      updateData.isVip = data.isVip;
    }

    if (data.isMedical !== undefined) {
      updateData.isMedical = data.isMedical;
    }

    if (avatarUrl !== existingService.avatar) {
      updateData.avatar = avatarUrl;
    }

    if (files.length > 0) {
      updateData.files = files;
    }

    // Update service
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        price: true,
        estimatedTime: true,
        description: true,
        avatar: true,
        files: true,
        gender: true,
        isVip: true,
        isMedical: true,
        parentServiceId: true,
        created: true,
        updated: true,
      },
    });

    const formattedService: ServiceItem = {
      id: service.id,
      name: service.name,
      price: service.price ? Number(service.price) : null,
      estimatedTime: service.estimatedTime,
      description: service.description,
      avatar: service.avatar,
      files: Array.isArray(service.files) ? (service.files as string[]) : [],
      gender: service.gender as 'male' | 'female' | 'other',
      isVip: service.isVip,
      isMedical: service.isMedical,
      parentServiceId: service.parentServiceId,
      createdAt: Number(service.created),
      updatedAt: Number(service.updated),
    };

    return {
      success: true,
      message: 'سرویس با موفقیت به‌روزرسانی شد',
      data: {
        service: formattedService,
      },
    };
  } catch (error) {
    console.error('Error editing service:', error);
    return {
      success: false,
      message: 'به‌روزرسانی سرویس با خطا مواجه شد',
    };
  }
}



