import { Request, Response } from 'express';
import { loginWithPasswordService } from './login.service';
import { LoginWithPasswordRequest } from './login.type';

/**
 * Login with Password Controller
 * POST /api/auth/login/password
 */
export async function loginWithPasswordController(req: Request, res: Response): Promise<void> {
  try {
    const data: LoginWithPasswordRequest & { userType?: 'customer' | 'barber'; gender?: 'male' | 'female' | 'other' } = req.body;

    if (!data.phone || !data.password) {
      res.status(400).json({
        success: false,
        message: 'شماره تلفن و رمز عبور الزامی است',
      });
      return;
    }

    const result = await loginWithPasswordService(
      { phone: data.phone, password: data.password },
      data.userType,
      data.gender
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in loginWithPasswordController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

