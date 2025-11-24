import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { editProfileService } from './editprofile.service';
import { EditProfileRequest } from './profile.type';

/**
 * Edit Profile Controller
 * PUT /api/profile
 * 
 * Request Body (multipart/form-data):
 * - firstName?: string
 * - lastName?: string
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
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };

    // Get files from request (using req.files for multiple files)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const profileImageFile = files?.profileImage?.[0];
    const backgroundImageFile = files?.backgroundImage?.[0];

    // Validate that at least one field is provided
    if (
      (editData.firstName === undefined || editData.firstName === '') &&
      (editData.lastName === undefined || editData.lastName === '') &&
      !profileImageFile &&
      !backgroundImageFile
    ) {
      res.status(400).json({
        success: false,
        message: 'حداقل یکی از فیلدها (نام، نام خانوادگی، عکس پروفایل یا عکس بک‌گراند) باید ارسال شود',
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

    // Validate firstName and lastName if provided
    if (editData.firstName !== undefined && editData.firstName.trim().length > 20) {
      res.status(400).json({
        success: false,
        message: 'نام نمی‌تواند بیشتر از 20 کاراکتر باشد',
      });
      return;
    }

    if (editData.lastName !== undefined && editData.lastName.trim().length > 20) {
      res.status(400).json({
        success: false,
        message: 'نام خانوادگی نمی‌تواند بیشتر از 20 کاراکتر باشد',
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
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

