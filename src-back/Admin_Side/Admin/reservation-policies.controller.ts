import { Request, Response } from 'express';
import type { PutReservationPolicyRequest } from '../../All_Utils/ReservationPolicy/reservation-policy.dto';
import { getDefaultReservationPolicy, putDefaultReservationPolicy } from '../../All_Utils/ReservationPolicy/reservation-policy.service';

export async function getDefaultReservationPolicyController(req: Request, res: Response): Promise<void> {
  const result = await getDefaultReservationPolicy();
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
}

export async function putDefaultReservationPolicyController(req: Request, res: Response): Promise<void> {
  const body = req.body as PutReservationPolicyRequest;
  const result = await putDefaultReservationPolicy(body);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
}

