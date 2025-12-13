import { Request, Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import { registerDeviceToken, sendNotificationToUser, getUsersWithDevices } from './notification.service';
import { RegisterTokenRequest } from './notification.type';

/**
 * Register Device Token Controller
 */
export async function registerTokenController(req: Request, res: Response) {
  try {
    const { fcmToken, platform } = req.body as RegisterTokenRequest;
    
    // Auth middleware should populate user
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    // Determine user type (default to customer)
    const userType = user.userType === 'barber' ? 'barber' : 'customer';

    const result = await registerDeviceToken(
      user.id,
      userType,
      fcmToken,
      platform
    );

    res.json(result);
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Get Users with Devices (Admin)
 */
export async function getUsersWithDevicesController(req: Request, res: Response) {
  try {
    const result = await getUsersWithDevices();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Get users with devices error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

/**
 * Send Notification (Admin)
 */
export async function adminSendNotificationController(req: Request, res: Response) {
  try {
    const { userId, userType, title, body, data } = req.body;
    
    if (!userId || !userType || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, userType, title, and body are required' 
      });
    }

    if (userType !== 'customer' && userType !== 'barber') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userType. Must be "customer" or "barber"' 
      });
    }

    const result = await sendNotificationToUser({
      userId: Number(userId),
      userType: userType as 'customer' | 'barber',
      title: String(title),
      body: String(body),
      data: data || undefined
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Admin send notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending notification', 
      error: String(error) 
    });
  }
}
