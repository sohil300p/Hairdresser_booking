import { Response } from 'express';
import { AuthRequest } from '../../User_Side/auth/auth.middleware';
import {
  createInvitationService,
  listInvitationsService,
  listMembersService,
  getMyPendingInvitationsService,
  acceptInvitationService,
} from './seats.service';

export async function createInvitationController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
      return;
    }
    const result = await createInvitationService(req.user.barberId, req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    console.error('createInvitationController', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function listInvitationsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
      return;
    }
    const result = await listInvitationsService(req.user.barberId);
    res.status(200).json(result);
  } catch (e) {
    console.error('listInvitationsController', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function listMembersController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
      return;
    }
    const result = await listMembersService(req.user.barberId);
    res.status(200).json(result);
  } catch (e) {
    console.error('listMembersController', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function getMyPendingInvitationsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
      return;
    }
    const result = await getMyPendingInvitationsService(req.user.barberId);
    res.status(200).json(result);
  } catch (e) {
    console.error('getMyPendingInvitationsController', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function acceptInvitationController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
      return;
    }
    const token = (req.params.token as string)?.trim();
    if (!token || token.length < 10) {
      res.status(400).json({ success: false, message: 'توکن دعوت نامعتبر است' });
      return;
    }
    const result = await acceptInvitationService(req.user.barberId, token);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    console.error('acceptInvitationController', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}
