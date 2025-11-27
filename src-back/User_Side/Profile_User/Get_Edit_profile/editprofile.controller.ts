import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { editProfileService } from './editprofile.service';
import { EditProfileRequest } from './profile.type';

/**
 * Edit Profile Controller
 * PUT /api/profile
 * 
 * Request Body (multipart/form-data):
 * - fullName?: string
 * - profileImage?: File (image file)
 * - backgroundImage?: File (image file)
 */
export async function editProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User info is attached by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const userId = req.user.id;

    // Extract data from request body
    const editData: EditProfileRequest = {
      fullName: req.body.fullName,
      gender: req.body.gender,
    };

    // Get files from request (using req.files for multiple files)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const profileImageFile = files?.profileImage?.[0];
    const backgroundImageFile = files?.backgroundImage?.[0];

    // Validate that at least one field is provided
    if (
      (editData.fullName === undefined || editData.fullName === '') &&
      (editData.gender === undefined || editData.gender === '') &&
      !profileImageFile &&
      !backgroundImageFile
    ) {
      res.status(400).json({
        success: false,
        message: 'حداقل یکی از فیلدها (نام کامل، جنسیت، عکس پروفایل یا عکس بک‌گراند) باید ارسال شود',
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

    // Validate fullName if provided
    if (editData.fullName !== undefined && editData.fullName.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: 'نام کامل نمی‌تواند بیشتر از 100 کاراکتر باشد',
      });
      return;
    }

    const result = await editProfileService(userId, editData, profileImageFile, backgroundImageFile);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in editProfileController:', error);
    
    // Ensure we always return JSON, not HTML
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'خطای داخلی سرور',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }
}

