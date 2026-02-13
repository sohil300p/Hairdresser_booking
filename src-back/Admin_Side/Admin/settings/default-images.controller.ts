import type { Request, Response } from 'express';
import { getDefaultImagesService, updateDefaultImagesService, type UpdateDefaultImagesInput } from './default-images.service';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function getDefaultImagesController(_req: Request, res: Response) {
  try {
    const data = await getDefaultImagesService();
    res.json({ success: true, data });
  } catch (e) {
    console.error('getDefaultImages', e);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات' });
  }
}

export async function getDefaultImagesPublicController(_req: Request, res: Response) {
  try {
    const data = await getDefaultImagesService();
    res.json({ success: true, data });
  } catch (e) {
    console.error('getDefaultImagesPublic', e);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات' });
  }
}

export async function updateDefaultImagesController(req: Request, res: Response) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const profileFile = files?.profileImage?.[0];
    const headerFile = files?.headerImage?.[0];

    if (profileFile && !ALLOWED_MIME.includes(profileFile.mimetype)) {
      res.status(400).json({ success: false, message: 'فرمت عکس پروفایل نامعتبر' });
      return;
    }
    if (headerFile && !ALLOWED_MIME.includes(headerFile.mimetype)) {
      res.status(400).json({ success: false, message: 'فرمت عکس هدر نامعتبر' });
      return;
    }

    const input: UpdateDefaultImagesInput = {
      defaultBarberProfileImageUrl: req.body.defaultBarberProfileImageUrl,
      defaultBarberHeaderImageUrl: req.body.defaultBarberHeaderImageUrl,
      profileImageFile: profileFile,
      headerImageFile: headerFile,
    };
    const data = await updateDefaultImagesService(input);
    res.json({ success: true, data });
  } catch (e) {
    console.error('updateDefaultImages', e);
    res.status(500).json({ success: false, message: 'خطا در بروزرسانی تنظیمات' });
  }
}
