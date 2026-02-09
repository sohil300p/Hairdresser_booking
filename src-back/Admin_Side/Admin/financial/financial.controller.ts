import { Request, Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import {
  getWalletSummariesService,
  getFinancialMetricsService,
  getAdminTransactionsService,
} from './financial.service';

export async function getWalletSummariesController(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const summaries = await getWalletSummariesService();
    return res.json({ success: true, data: summaries });
  } catch (error) {
    console.error('getWalletSummaries error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

export async function getFinancialMetricsController(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const metrics = await getFinancialMetricsService();
    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('getFinancialMetrics error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: String(error) });
  }
}

export async function getAdminTransactionsController(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || (authReq.user.role !== 'admin' && authReq.user.role !== 'staff_admin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const ownerType = req.query.ownerType as string | undefined;
    const type = req.query.type as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const filters = { ownerType, type, from, to, page, limit };
    const result = await getAdminTransactionsService(filters);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('getAdminTransactions error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error', error: String(error) });
  }
}
