import { Response } from 'express';
import { AuthRequest } from '../../../User_Side/auth/auth.middleware';
import {
  getWalletBalanceService,
  depositService,
  withdrawService,
  transferService,
  getTransactionHistoryService,
  lockFundsForAppointmentService,
} from './transaction.service';
import {
  GetWalletBalanceRequest,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  GetTransactionHistoryRequest,
  LockFundsRequest,
} from './transaction.type';

/**
 * Get Wallet Balance Controller for Barber
 * GET /api/barber/wallet/balance
 */
export async function getWalletBalanceController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: GetWalletBalanceRequest = {
      ownerType: req.query.ownerType as any || 'barber',
      ownerId: req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined,
    };

    const result = await getWalletBalanceService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getWalletBalanceController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Deposit Controller for Barber
 * POST /api/barber/wallet/deposit
 */
export async function depositController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: DepositRequest = req.body;

    if (!data.amount || !data.method) {
      res.status(400).json({
        success: false,
        message: 'مبلغ و روش پرداخت الزامی است',
      });
      return;
    }

    const result = await depositService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in depositController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Withdraw Controller for Barber
 * POST /api/barber/wallet/withdraw
 */
export async function withdrawController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: WithdrawRequest = req.body;

    if (!data.amount || !data.method) {
      res.status(400).json({
        success: false,
        message: 'مبلغ و روش پرداخت الزامی است',
      });
      return;
    }

    const result = await withdrawService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in withdrawController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Transfer Controller for Barber
 * POST /api/barber/wallet/transfer
 */
export async function transferController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: TransferRequest = req.body;

    if (!data.toOwnerType || !data.toOwnerId || !data.amount) {
      res.status(400).json({
        success: false,
        message: 'نوع گیرنده، شناسه گیرنده و مبلغ الزامی است',
      });
      return;
    }

    const result = await transferService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in transferController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get Transaction History Controller for Barber
 * GET /api/barber/wallet/history
 */
export async function getTransactionHistoryController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: GetTransactionHistoryRequest = {
      ownerType: req.query.ownerType as any || 'barber',
      ownerId: req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      type: req.query.type as any || 'all',
    };

    const result = await getTransactionHistoryService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getTransactionHistoryController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Lock Funds for Appointment Controller for Barber
 * POST /api/barber/wallet/lock
 */
export async function lockFundsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'barber' || !req.user.barberId) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید',
      });
      return;
    }

    const data: LockFundsRequest = req.body;

    if (!data.appointmentId || !data.amount) {
      res.status(400).json({
        success: false,
        message: 'شناسه نوبت و مبلغ الزامی است',
      });
      return;
    }

    const result = await lockFundsForAppointmentService(data, req.user.barberId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in lockFundsController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

