import { Request, Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import { ensureBarberRecord } from '../utils/barber.utils';
import type { PutReservationPolicyRequest } from '../../../All_Utils/ReservationPolicy/reservation-policy.dto';
import {
  getEffectivePolicyForBarberShop,
  putBarberPolicy,
  putBarbershopPolicy,
  putServicePolicy,
} from '../../../All_Utils/ReservationPolicy/reservation-policy.service';
import prisma from '../../../All_Utils/config/prisma';

async function getOwnedBarbershopId(barberId: number): Promise<number | null> {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { ownedBarbershops: { take: 1, select: { id: true } } },
  });
  return barber?.ownedBarbershops?.[0]?.id ?? null;
}

export async function getEffectiveReservationPolicyController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    const barberId = await ensureBarberRecord(req.user.id);
    const barbershopId = await getOwnedBarbershopId(barberId);
    if (!barbershopId) {
      res.status(404).json({ success: false, message: 'آرایشگاه یافت نشد' });
      return;
    }

    const serviceId = req.query.serviceId ? parseInt(req.query.serviceId as string, 10) : undefined;
    const targetBarberId = req.query.barberId ? parseInt(req.query.barberId as string, 10) : undefined;

    const result = await getEffectivePolicyForBarberShop({ barbershopId, serviceId, barberId: targetBarberId });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (e) {
    console.error('getEffectiveReservationPolicyController error:', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function putBarbershopReservationPolicyController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    const barberId = await ensureBarberRecord(req.user.id);
    const barbershopId = await getOwnedBarbershopId(barberId);
    if (!barbershopId) {
      res.status(404).json({ success: false, message: 'آرایشگاه یافت نشد' });
      return;
    }

    const body = req.body as PutReservationPolicyRequest;
    const result = await putBarbershopPolicy({ barbershopId, data: body });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (e) {
    console.error('putBarbershopReservationPolicyController error:', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function putServiceReservationPolicyController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    const barberId = await ensureBarberRecord(authReq.user.id);
    const barbershopId = await getOwnedBarbershopId(barberId);
    if (!barbershopId) {
      res.status(404).json({ success: false, message: 'آرایشگاه یافت نشد' });
      return;
    }

    const serviceId = parseInt(req.params.serviceId, 10);
    if (Number.isNaN(serviceId)) {
      res.status(400).json({ success: false, message: 'شناسه سرویس نامعتبر است' });
      return;
    }

    const body = req.body as PutReservationPolicyRequest;
    const result = await putServicePolicy({ serviceId, barbershopId, data: body });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (e) {
    console.error('putServiceReservationPolicyController error:', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

export async function putBarberReservationPolicyController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است' });
      return;
    }
    const barberId = await ensureBarberRecord(authReq.user.id);
    const barbershopId = await getOwnedBarbershopId(barberId);
    if (!barbershopId) {
      res.status(404).json({ success: false, message: 'آرایشگاه یافت نشد' });
      return;
    }

    const targetBarberId = parseInt(req.params.barberId, 10);
    if (Number.isNaN(targetBarberId)) {
      res.status(400).json({ success: false, message: 'شناسه آرایشگر نامعتبر است' });
      return;
    }

    const body = req.body as PutReservationPolicyRequest;
    const result = await putBarberPolicy({ ownerBarbershopId: barbershopId, targetBarberId, data: body });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (e) {
    console.error('putBarberReservationPolicyController error:', e);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
}

