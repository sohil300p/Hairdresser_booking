import prisma from '../../../../All_Utils/config/prisma';
import {
  GetWalletBalanceRequest,
  GetWalletBalanceResponse,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  TransferRequest,
  TransferResponse,
  GetTransactionHistoryRequest,
  GetTransactionHistoryResponse,
  LockFundsRequest,
  LockFundsResponse,
} from './transaction.type';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get or create wallet for barber
 */
async function getOrCreateWallet(
  ownerType: 'barber' | 'barbershop',
  ownerId: number,
  currency: string = 'IRR'
): Promise<{ id: number; balance: Decimal }> {
  let wallet = await prisma.wallet.findFirst({
    where: {
      ownerType,
      ownerId,
      currency,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        ownerType,
        ownerId,
        currency,
        balance: new Decimal(0),
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });
  }

  return wallet;
}

/**
 * Calculate wallet balance from internal transactions
 * Single source of truth for balance
 */
async function calculateWalletBalance(walletId: number): Promise<Decimal> {
  const credits = await prisma.internalTransaction.aggregate({
    where: {
      toWalletId: walletId,
      direction: 'credit',
    },
    _sum: {
      amount: true,
    },
  });

  const debits = await prisma.internalTransaction.aggregate({
    where: {
      fromWalletId: walletId,
      direction: 'debit',
    },
    _sum: {
      amount: true,
    },
  });

  const creditSum = credits._sum.amount || new Decimal(0);
  const debitSum = debits._sum.amount || new Decimal(0);
  return creditSum.minus(debitSum);
}

/**
 * Get wallet balance service for barber
 */
export async function getWalletBalanceService(
  data: GetWalletBalanceRequest,
  barberId: number
): Promise<GetWalletBalanceResponse> {
  try {
    const { ownerType = 'barber', ownerId } = data;
    const finalOwnerId = ownerId || barberId;

    const wallet = await getOrCreateWallet(ownerType, finalOwnerId);

    // Calculate actual balance from transactions
    const actualBalance = await calculateWalletBalance(wallet.id);

    // Update cached balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: actualBalance,
        updated: BigInt(Date.now()),
      },
    });

    // Update barber's cached balance
    if (ownerType === 'barber') {
      await prisma.barber.update({
        where: { id: finalOwnerId },
        data: {
          walletBalance: actualBalance,
          updated: BigInt(Date.now()),
        },
      });
    }

    return {
      success: true,
      message: 'موجودی کیف پول با موفقیت دریافت شد',
      balance: Number(actualBalance),
      currency: wallet.currency,
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return {
      success: false,
      message: 'دریافت موجودی کیف پول با خطا مواجه شد',
    };
  }
}

/**
 * Deposit service for barber
 */
export async function depositService(
  data: DepositRequest,
  barberId: number
): Promise<DepositResponse> {
  try {
    const { amount, method, reference, metadata } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const wallet = await getOrCreateWallet('barber', barberId);

    // Create external transaction
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: 'barber',
        initiatorId: barberId,
        kind: 'deposit',
        amount: new Decimal(amount),
        method: method as any,
        status: method === 'wallet' ? 'success' : 'pending',
        reference,
        metadata: metadata || {},
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // For wallet method, process immediately
    if (method === 'wallet') {
      // Create internal transaction (credit to wallet)
      const internalTx = await prisma.internalTransaction.create({
        data: {
          parentExternalTransactionId: externalTx.id,
          toWalletId: wallet.id,
          amount: new Decimal(amount),
          direction: 'credit',
          note: `Deposit via ${method}`,
          created: BigInt(Date.now()),
        },
      });

      // Update wallet balance
      const newBalance = await calculateWalletBalance(wallet.id);
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          updated: BigInt(Date.now()),
        },
      });

      // Update barber's cached balance
      await prisma.barber.update({
        where: { id: barberId },
        data: {
          walletBalance: newBalance,
          updated: BigInt(Date.now()),
        },
      });

      return {
        success: true,
        message: 'واریز با موفقیت انجام شد',
        transactionId: internalTx.id,
        externalTransactionId: externalTx.id,
      };
    } else {
      // For online/card methods, create pending internal transaction
      const internalTx = await prisma.internalTransaction.create({
        data: {
          parentExternalTransactionId: externalTx.id,
          toWalletId: wallet.id,
          amount: new Decimal(amount),
          direction: 'credit',
          note: `Deposit via ${method} (pending verification)`,
          created: BigInt(Date.now()),
        },
      });

      return {
        success: true,
        message: 'درخواست واریز ایجاد شد. لطفاً پرداخت را تکمیل کنید.',
        transactionId: internalTx.id,
        externalTransactionId: externalTx.id,
      };
    }
  } catch (error) {
    console.error('Error in deposit service:', error);
    return {
      success: false,
      message: 'واریز با خطا مواجه شد',
    };
  }
}

/**
 * Withdraw service for barber
 */
export async function withdrawService(
  data: WithdrawRequest,
  barberId: number
): Promise<WithdrawResponse> {
  try {
    const { amount, method, reference, metadata } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const wallet = await getOrCreateWallet('barber', barberId);

    // Check balance
    const balance = await calculateWalletBalance(wallet.id);
    if (balance.lessThan(amount)) {
      return {
        success: false,
        message: 'موجودی کافی نیست',
      };
    }

    // Create external transaction
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: 'barber',
        initiatorId: barberId,
        kind: 'withdrawal',
        amount: new Decimal(amount),
        method: method as any,
        status: 'pending',
        reference,
        metadata: metadata || {},
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // Create internal transaction (debit from wallet)
    const internalTx = await prisma.internalTransaction.create({
      data: {
        parentExternalTransactionId: externalTx.id,
        fromWalletId: wallet.id,
        amount: new Decimal(amount),
        direction: 'debit',
        note: `Withdrawal via ${method}`,
        created: BigInt(Date.now()),
      },
    });

    // Update wallet balance
    const newBalance = await calculateWalletBalance(wallet.id);
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        updated: BigInt(Date.now()),
      },
    });

    // Update barber's cached balance
    await prisma.barber.update({
      where: { id: barberId },
      data: {
        walletBalance: newBalance,
        updated: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'برداشت با موفقیت انجام شد',
      transactionId: internalTx.id,
      externalTransactionId: externalTx.id,
    };
  } catch (error) {
    console.error('Error in withdraw service:', error);
    return {
      success: false,
      message: 'برداشت با خطا مواجه شد',
    };
  }
}

/**
 * Transfer service for barber
 */
export async function transferService(
  data: TransferRequest,
  barberId: number
): Promise<TransferResponse> {
  try {
    const { toOwnerType, toOwnerId, amount, note } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const fromWallet = await getOrCreateWallet('barber', barberId);
    const toWallet = await getOrCreateWallet(toOwnerType, toOwnerId);

    // Check balance
    const balance = await calculateWalletBalance(fromWallet.id);
    if (balance.lessThan(amount)) {
      return {
        success: false,
        message: 'موجودی کافی نیست',
      };
    }

    // Create external transaction
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: 'barber',
        initiatorId: barberId,
        kind: 'deposit',
        amount: new Decimal(amount),
        status: 'success',
        metadata: { type: 'transfer', fromOwnerType: 'barber', fromOwnerId: barberId },
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // Create debit transaction (from sender)
    const debitTx = await prisma.internalTransaction.create({
      data: {
        parentExternalTransactionId: externalTx.id,
        fromWalletId: fromWallet.id,
        amount: new Decimal(amount),
        direction: 'debit',
        note: note || `Transfer to ${toOwnerType} ${toOwnerId}`,
        created: BigInt(Date.now()),
      },
    });

    // Create credit transaction (to receiver)
    await prisma.internalTransaction.create({
      data: {
        parentExternalTransactionId: externalTx.id,
        toWalletId: toWallet.id,
        amount: new Decimal(amount),
        direction: 'credit',
        note: note || `Transfer from barber ${barberId}`,
        created: BigInt(Date.now()),
      },
    });

    // Update both wallet balances
    const fromBalance = await calculateWalletBalance(fromWallet.id);
    const toBalance = await calculateWalletBalance(toWallet.id);

    await prisma.wallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: fromBalance,
        updated: BigInt(Date.now()),
      },
    });

    await prisma.wallet.update({
      where: { id: toWallet.id },
      data: {
        balance: toBalance,
        updated: BigInt(Date.now()),
      },
    });

    // Update barber's cached balance
    await prisma.barber.update({
      where: { id: barberId },
      data: {
        walletBalance: fromBalance,
        updated: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'انتقال با موفقیت انجام شد',
      transactionId: debitTx.id,
    };
  } catch (error) {
    console.error('Error in transfer service:', error);
    return {
      success: false,
      message: 'انتقال با خطا مواجه شد',
    };
  }
}

/**
 * Get transaction history service for barber
 */
export async function getTransactionHistoryService(
  data: GetTransactionHistoryRequest,
  barberId: number
): Promise<GetTransactionHistoryResponse> {
  try {
    const { ownerType = 'barber', ownerId, page = 1, limit = 20, type = 'all' } = data;
    const finalOwnerId = ownerId || barberId;

    const wallet = await getOrCreateWallet(ownerType, finalOwnerId);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { toWalletId: wallet.id },
        { fromWalletId: wallet.id },
      ],
    };

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.internalTransaction.findMany({
        where,
        include: {
          parentExternal: {
            select: {
              kind: true,
              status: true,
              method: true,
              relatedAppointmentId: true,
            },
          },
        },
        orderBy: {
          created: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.internalTransaction.count({ where }),
    ]);

    const formattedTransactions = transactions.map((tx) => {
      const isCredit = tx.direction === 'credit';
      const kind = tx.parentExternal.kind;
      let txType: 'deposit' | 'withdrawal' | 'transfer' | 'lock' = 'transfer';

      if (kind === 'deposit' && isCredit) {
        txType = 'deposit';
      } else if (kind === 'withdrawal' && !isCredit) {
        txType = 'withdrawal';
      } else if (kind === 'appointment_lock') {
        txType = 'lock';
      }

      return {
        id: tx.id,
        type: txType,
        amount: Number(tx.amount),
        direction: tx.direction,
        status: tx.parentExternal.status,
        method: tx.parentExternal.method || undefined,
        note: tx.note || undefined,
        createdAt: Number(tx.created),
        relatedAppointmentId: tx.parentExternal.relatedAppointmentId || undefined,
      };
    });

    return {
      success: true,
      message: 'تاریخچه تراکنش‌ها با موفقیت دریافت شد',
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return {
      success: false,
      message: 'دریافت تاریخچه تراکنش‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Lock funds for appointment service (for barber - usually not used but kept for consistency)
 */
export async function lockFundsForAppointmentService(
  data: LockFundsRequest,
  barberId: number
): Promise<LockFundsResponse> {
  try {
    const { appointmentId, amount, method = 'wallet' } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    // Verify appointment exists and belongs to barber
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        barberId: true,
      },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'نوبت یافت نشد',
      };
    }

    if (appointment.barberId !== barberId) {
      return {
        success: false,
        message: 'شما مجاز به قفل کردن وجه برای این نوبت نیستید',
      };
    }

    const wallet = await getOrCreateWallet('barber', barberId);

    // Check balance if using wallet
    if (method === 'wallet') {
      const balance = await calculateWalletBalance(wallet.id);
      if (balance.lessThan(amount)) {
        return {
          success: false,
          message: 'موجودی کافی نیست',
        };
      }
    }

    // Create external transaction
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: 'barber',
        initiatorId: barberId,
        kind: 'appointment_lock',
        relatedAppointmentId: appointmentId,
        amount: new Decimal(amount),
        method: method as any,
        status: method === 'wallet' ? 'success' : 'pending',
        metadata: { appointmentId },
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });

    // If using wallet, create internal transaction
    if (method === 'wallet') {
      const internalTx = await prisma.internalTransaction.create({
        data: {
          parentExternalTransactionId: externalTx.id,
          fromWalletId: wallet.id,
          amount: new Decimal(amount),
          direction: 'debit',
          note: `Locked for appointment ${appointmentId}`,
          created: BigInt(Date.now()),
        },
      });

      // Update wallet balance
      const newBalance = await calculateWalletBalance(wallet.id);
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          updated: BigInt(Date.now()),
        },
      });

      // Update barber cached balance
      await prisma.barber.update({
        where: { id: barberId },
        data: {
          walletBalance: newBalance,
          updated: BigInt(Date.now()),
        },
      });

      return {
        success: true,
        message: 'وجه با موفقیت قفل شد',
        transactionId: internalTx.id,
        externalTransactionId: externalTx.id,
      };
    }

    return {
      success: true,
      message: 'درخواست قفل وجه ایجاد شد',
      transactionId: externalTx.id,
      externalTransactionId: externalTx.id,
    };
  } catch (error) {
    console.error('Error locking funds:', error);
    return {
      success: false,
      message: 'قفل کردن وجه با خطا مواجه شد',
    };
  }
}

