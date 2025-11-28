import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { getServicesService, createServiceService, editServiceService } from './service.service';
import { CreateServiceRequest, EditServiceRequest } from './service.type';

/**
 * Get Services Controller
 * GET /api/barber/services
 */
export async function getServicesController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    // Get barbershop ID from barber
    const barber = await require('../../../../All_Utils/config/prisma').default.barber.findUnique({
      where: { id: req.user.barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;
    const result = await getServicesService(barbershopId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getServicesController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Create Service Controller
 * POST /api/barber/services
 */
export async function createServiceController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    // Get barbershop ID
    const prisma = require('../../../../All_Utils/config/prisma').default;
    const barber = await prisma.barber.findUnique({
      where: { id: req.user.barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    // Extract data
    const createData: CreateServiceRequest = {
      name: req.body.name,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      estimatedTime: parseInt(req.body.estimatedTime),
      description: req.body.description,
      gender: req.body.gender,
      isVip: req.body.isVip === 'true' || req.body.isVip === true,
      isMedical: req.body.isMedical === 'true' || req.body.isMedical === true,
      parentServiceId: req.body.parentServiceId ? parseInt(req.body.parentServiceId) : undefined,
    };

    // Validate
    if (!createData.name || !createData.name.trim()) {
      res.status(400).json({
        success: false,
        message: 'نام سرویس الزامی است',
      });
      return;
    }

    if (!createData.estimatedTime || createData.estimatedTime <= 0) {
      res.status(400).json({
        success: false,
        message: 'زمان تخمینی سرویس باید بیشتر از صفر باشد',
      });
      return;
    }

    if (!createData.gender || !['male', 'female', 'other'].includes(createData.gender)) {
      res.status(400).json({
        success: false,
        message: 'جنسیت سرویس باید یکی از مقادیر male، female یا other باشد',
      });
      return;
    }

    // Get files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const avatarFile = files?.avatar?.[0];
    const sampleImageFiles = files?.sampleImages;

    // Validate file types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (avatarFile && !allowedMimeTypes.includes(avatarFile.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'فرمت فایل عکس آواتار نامعتبر است',
      });
      return;
    }

    if (sampleImageFiles) {
      for (const file of sampleImageFiles) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          res.status(400).json({
            success: false,
            message: 'فرمت فایل عکس نمونه کار نامعتبر است',
          });
          return;
        }
      }
    }

    const result = await createServiceService(barbershopId, createData, avatarFile, sampleImageFiles);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createServiceController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Edit Service Controller
 * PUT /api/barber/services/:id
 */
export async function editServiceController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه سرویس نامعتبر است',
      });
      return;
    }

    // Get barbershop ID
    const prisma = require('../../../../All_Utils/config/prisma').default;
    const barber = await prisma.barber.findUnique({
      where: { id: req.user.barberId },
      select: {
        ownedBarbershops: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!barber || !barber.ownedBarbershops[0]) {
      res.status(404).json({
        success: false,
        message: 'سالن آرایشگاه یافت نشد',
      });
      return;
    }

    const barbershopId = barber.ownedBarbershops[0].id;

    // Extract data
    const editData: EditServiceRequest = {
      name: req.body.name,
      price: req.body.price !== undefined ? parseFloat(req.body.price) : undefined,
      estimatedTime: req.body.estimatedTime ? parseInt(req.body.estimatedTime) : undefined,
      description: req.body.description,
      gender: req.body.gender,
      isVip: req.body.isVip !== undefined ? (req.body.isVip === 'true' || req.body.isVip === true) : undefined,
      isMedical: req.body.isMedical !== undefined ? (req.body.isMedical === 'true' || req.body.isMedical === true) : undefined,
    };

    // Validate at least one field
    if (
      editData.name === undefined &&
      editData.price === undefined &&
      editData.estimatedTime === undefined &&
      editData.description === undefined &&
      editData.gender === undefined &&
      editData.isVip === undefined &&
      editData.isMedical === undefined &&
      !req.files
    ) {
      res.status(400).json({
        success: false,
        message: 'حداقل یکی از فیلدها باید ارسال شود',
      });
      return;
    }

    // Get files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const avatarFile = files?.avatar?.[0];
    const sampleImageFiles = files?.sampleImages;

    // Validate file types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (avatarFile && !allowedMimeTypes.includes(avatarFile.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'فرمت فایل عکس آواتار نامعتبر است',
      });
      return;
    }

    if (sampleImageFiles) {
      for (const file of sampleImageFiles) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          res.status(400).json({
            success: false,
            message: 'فرمت فایل عکس نمونه کار نامعتبر است',
          });
          return;
        }
      }
    }

    const result = await editServiceService(serviceId, barbershopId, editData, avatarFile, sampleImageFiles);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in editServiceController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

