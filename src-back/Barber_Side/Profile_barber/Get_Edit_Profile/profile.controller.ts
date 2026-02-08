import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import { getBarberProfileService, createBarberProfileService } from './profile.service';
import { CreateBarberProfileRequest } from './profile.type';
import { ensureBarberRecord } from '../utils/barber.utils';

/**
 * Get Barber Profile Controller
 * GET /api/barber/profile
 */
export async function getBarberProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User info is attached by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);
    const result = await getBarberProfileService(barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getBarberProfileController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Create Barber Profile Controller
 * POST /api/barber/profile
 * 
 * Request Body (multipart/form-data):
 * - name: string (required)
 * - gender: 'male' | 'female' | 'unisex' (required)
 * - address?: string
 * - description?: string
 * - city?: string
 * - neighborhood?: string
 * - latitude?: number
 * - longitude?: number
 * - profileImage?: File (image file)
 * - backgroundImage?: File (image file)
 * 
 * This API is for creating barbershop profile for the first time
 */
export async function createBarberProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User info is attached by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Ensure barber record exists (auto-create if needed)
    const barberId = await ensureBarberRecord(req.user.id);

    // Extract data from request body
    const createData: CreateBarberProfileRequest = {
      name: req.body.name,
      fullName: req.body.fullName,
      gender: req.body.gender,
      address: req.body.address,
      description: req.body.description,
      city: req.body.city,
      neighborhood: req.body.neighborhood,
      latitude: req.body.latitude ? parseFloat(req.body.latitude as string) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude as string) : undefined,
    };

    // Validate required fields
    if (!createData.name || !createData.name.trim()) {
      res.status(400).json({
        success: false,
        message: 'نام سالن الزامی است',
      });
      return;
    }

    if (!createData.gender) {
      res.status(400).json({
        success: false,
        message: 'جنسیت سالن الزامی است',
      });
      return;
    }

    // Validate gender value
    if (!['male', 'female', 'unisex'].includes(createData.gender)) {
      res.status(400).json({
        success: false,
        message: 'جنسیت سالن باید یکی از مقادیر male، female یا unisex باشد',
      });
      return;
    }

    // Get files from request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const profileImageFile = files?.profileImage?.[0];
    const backgroundImageFile = files?.backgroundImage?.[0];

    // Validate file types if files are uploaded
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (profileImageFile && !allowedMimeTypes.includes(profileImageFile.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'فرمت فایل عکس پروفایل نامعتبر است. فقط تصاویر (JPEG, PNG, GIF, WebP) مجاز هستند',
      });
      return;
    }

    if (backgroundImageFile && !allowedMimeTypes.includes(backgroundImageFile.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'فرمت فایل عکس بک‌گراند نامعتبر است. فقط تصاویر (JPEG, PNG, GIF, WebP) مجاز هستند',
      });
      return;
    }

    // Validate name length
    if (createData.name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: 'نام سالن نمی‌تواند بیشتر از 100 کاراکتر باشد',
      });
      return;
    }

    // Validate address length if provided
    if (createData.address && createData.address.trim().length > 500) {
      res.status(400).json({
        success: false,
        message: 'آدرس نمی‌تواند بیشتر از 500 کاراکتر باشد',
      });
      return;
    }

    // Validate description length if provided
    if (createData.description && createData.description.trim().length > 2000) {
      res.status(400).json({
        success: false,
        message: 'توضیحات نمی‌تواند بیشتر از 2000 کاراکتر باشد',
      });
      return;
    }

    const result = await createBarberProfileService(barberId, createData, profileImageFile, backgroundImageFile);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createBarberProfileController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}
