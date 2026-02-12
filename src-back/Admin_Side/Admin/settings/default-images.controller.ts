import type { Request, Response } from 'express';
import { getDefaultImagesService, updateDefaultImagesService, type DefaultImages } from './default-images.service';

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
    const body = req.body as Partial<DefaultImages>;
    const data = await updateDefaultImagesService(body);
    res.json({ success: true, data });
  } catch (e) {
    console.error('updateDefaultImages', e);
    res.status(500).json({ success: false, message: 'خطا در بروزرسانی تنظیمات' });
  }
}
