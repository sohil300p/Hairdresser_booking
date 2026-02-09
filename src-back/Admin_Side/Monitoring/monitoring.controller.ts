import { Request, Response } from 'express';
import { getSystemMetrics } from './monitoring.service';
import { authenticateToken, AuthRequest } from '../../User_Side/auth/auth.middleware';

/**
 * Get System Metrics Controller
 * GET /api/admin/monitoring/metrics
 * Requires admin authentication
 */
export async function getSystemMetricsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff_admin')) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }
    
    const metrics = await getSystemMetrics();
    
    if (metrics.success) {
      res.status(200).json(metrics);
    } else {
      res.status(500).json(metrics);
    }
  } catch (error) {
    console.error('Error in getSystemMetricsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
      timestamp: new Date().toISOString(),
    });
  }
}

