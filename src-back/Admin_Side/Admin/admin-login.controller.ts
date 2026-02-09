import { Request, Response } from 'express';
import { adminLoginService } from './admin-login.service';

/**
 * Admin login controller
 * POST /api/admin/login
 */
export async function adminLoginController(req: Request, res: Response) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن و رمز عبور الزامی است',
      });
    }

    const result = await adminLoginService({ phone, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in adminLoginController:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور در پردازش درخواست',
    });
  }
}

