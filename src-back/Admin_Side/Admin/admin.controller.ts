import { Request, Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import {
  getAllUsersService,
  getAllBarbersService,
  getAllAppointmentsService,
  resetUserOtpLimitService,
  getUserOtpStatusService,
  getAllAdminsService,
  getBarberAppointmentsService,
  getBarbershopServicesForAdminService,
  clearBarberReservationsService,
  clearBarberFinancialService,
} from './admin.service';

export async function getAllUsersController(req: Request, res: Response) {
  try {
    console.log('🔐 Admin users endpoint called');
    
    // Check admin access
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin') {
      console.log(`❌ Access denied. User role: ${authReq.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    console.log(`✅ Admin access granted for user ${authReq.user.id} (role: ${authReq.user.role})`);
    const result = await getAllUsersService();
    
    if (!result.success) {
      console.log('❌ Service returned error:', result.error);
      return res.status(500).json(result);
    }
    
    console.log(`✅ Sending ${result.users?.length || 0} users to client`);
    res.json(result);
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

export async function getAllBarbersController(req: Request, res: Response) {
  try {
    // Check admin access
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const result = await getAllBarbersService();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Get all barbers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

export async function getAllAppointmentsController(req: Request, res: Response) {
  try {
    // Check admin access
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const result = await getAllAppointmentsService();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

/**
 * Reset OTP limit for a user
 * POST /api/admin/users/:phone/reset-otp
 */
export async function resetUserOtpLimitController(req: Request, res: Response) {
  try {
    console.log('🔄 Admin reset OTP limit endpoint called');
    
    // Check admin access
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن الزامی است',
      });
    }

    console.log(`📞 Resetting OTP for phone: ${phone}`);
    const result = await resetUserOtpLimitService(phone);
    
    if (result.success) {
      console.log(`✅ OTP limit reset successfully for ${phone}`);
      res.json(result);
    } else {
      console.log(`❌ Failed to reset OTP: ${result.message}`);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Reset OTP limit error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
}

/**
 * Get OTP status for a user
 * GET /api/admin/users/:phone/otp-status
 */
export async function getUserOtpStatusController(req: Request, res: Response) {
  try {
    // Check admin access
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن الزامی است',
      });
    }

    const result = await getUserOtpStatusService(phone);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: String(error) 
    });
  }
}

/**
 * Get all admins and staff
 * GET /api/admin/staff
 */
export async function getAllAdminsController(req: Request, res: Response) {
  try {
    console.log('🔐 Admin staff endpoint called');
    
    // Check admin access - only full admin can view staff list
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (authReq.user.role !== 'admin') {
      console.log(`❌ Access denied. User role: ${authReq.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Full admin role required.',
      });
    }

    console.log(`✅ Admin access granted for user ${authReq.user.id} (role: ${authReq.user.role})`);
    const result = await getAllAdminsService();
    
    if (!result.success) {
      console.log('❌ Service returned error:', result.error);
      return res.status(500).json(result);
    }
    
    console.log(`✅ Sending ${result.admins?.length || 0} admins/staff to client`);
    res.json(result);
  } catch (error) {
    console.error('❌ Get all admins error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

function requireAdmin(req: Request): { success: false; status: number; body: object } | null {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return { success: false, status: 401, body: { success: false, message: 'Authentication required' } };
  }
  if (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin') {
    return { success: false, status: 403, body: { success: false, message: 'Access denied. Admin role required.' } };
  }
  return null;
}

export async function getBarberAppointmentsController(req: Request, res: Response) {
  const deny = requireAdmin(req);
  if (deny) return res.status(deny.status).json(deny.body);
  const barberId = parseInt(req.params.barberId, 10);
  if (Number.isNaN(barberId)) return res.status(400).json({ success: false, message: 'Invalid barberId' });
  try {
    const result = await getBarberAppointmentsService(barberId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error('getBarberAppointments error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getBarbershopServicesAdminController(req: Request, res: Response) {
  const deny = requireAdmin(req);
  if (deny) return res.status(deny.status).json(deny.body);
  const barbershopId = parseInt(req.params.barbershopId, 10);
  if (Number.isNaN(barbershopId)) return res.status(400).json({ success: false, message: 'Invalid barbershopId' });
  try {
    const result = await getBarbershopServicesForAdminService(barbershopId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error('getBarbershopServicesAdmin error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function clearBarberReservationsController(req: Request, res: Response) {
  const deny = requireAdmin(req);
  if (deny) return res.status(deny.status).json(deny.body);
  const barberId = parseInt(req.params.barberId, 10);
  if (Number.isNaN(barberId)) return res.status(400).json({ success: false, message: 'Invalid barberId' });
  try {
    const result = await clearBarberReservationsService(barberId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error('clearBarberReservations error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function clearBarberFinancialController(req: Request, res: Response) {
  const deny = requireAdmin(req);
  if (deny) return res.status(deny.status).json(deny.body);
  const barberId = parseInt(req.params.barberId, 10);
  if (Number.isNaN(barberId)) return res.status(400).json({ success: false, message: 'Invalid barberId' });
  try {
    const result = await clearBarberFinancialService(barberId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error('clearBarberFinancial error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

