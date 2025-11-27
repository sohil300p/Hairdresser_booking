import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import { editBarberProfileService } from './editprofile.service';
import { EditBarberProfileRequest } from './editprofile.type';

/**
 * Edit Barber Profile Controller
 * PUT /api/barber/profile
 * 
 * Request Body (multipart/form-data):
 * - name?: string
 * - gender?: 'male' | 'female' | 'unisex'
 * - address?: string
 * - description?: string
 * - profileImage?: File (image file)
 * - backgroundImage?: File (image file)
 */
export async function editBarberProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User info is attached by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Check if user is a barber
    if (req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const barberId = req.user.barberId;

    // Extract data from request body
    const editData: EditBarberProfileRequest = {
      name: req.body.name,
      gender: req.body.gender,
      address: req.body.address,
      description: req.body.description,
    };

    // Get files from request (using req.files for multiple files)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const profileImageFile = files?.profileImage?.[0];
    const backgroundImageFile = files?.backgroundImage?.[0];

    // Validate that at least one field is provided
    if (
      (editData.name === undefined || editData.name === '') &&
      editData.gender === undefined &&
      (editData.address === undefined || editData.address === '') &&
      (editData.description === undefined || editData.description === '') &&
      !profileImageFile &&
      !backgroundImageFile
    ) {
      res.status(400).json({
        success: false,
        message: 'حداقل یکی از فیلدها (نام سالن، جنسیت، آدرس، توضیحات، عکس پروفایل یا عکس بک‌گراند) باید ارسال شود',
      });
      return;
    }

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

    // Validate name if provided
    if (editData.name !== undefined && editData.name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: 'نام سالن نمی‌تواند بیشتر از 100 کاراکتر باشد',
      });
      return;
    }

    // Validate address if provided
    if (editData.address !== undefined && editData.address.trim().length > 500) {
      res.status(400).json({
        success: false,
        message: 'آدرس نمی‌تواند بیشتر از 500 کاراکتر باشد',
      });
      return;
    }

    // Validate description if provided
    if (editData.description !== undefined && editData.description.trim().length > 2000) {
      res.status(400).json({
        success: false,
        message: 'توضیحات نمی‌تواند بیشتر از 2000 کاراکتر باشد',
      });
      return;
    }

    const result = await editBarberProfileService(barberId, editData, profileImageFile, backgroundImageFile);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in editBarberProfileController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

