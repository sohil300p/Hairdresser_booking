import prisma from '../../../config/prisma';
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
 * Get or create wallet for owner
 */
async function getOrCreateWallet(
  ownerType: 'customer' | 'barber' | 'barbershop' | 'system',
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
export async function calculateWalletBalance(walletId: number): Promise<Decimal> {
  const result = await prisma.internalTransaction.aggregate({
    where: {
      OR: [
        { toWalletId: walletId, direction: 'credit' },
        { fromWalletId: walletId, direction: 'debit' },
      ],
    },
    _sum: {
      amount: true,
    },
  });

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
 * Get wallet balance service
 */
export async function getWalletBalanceService(
  data: GetWalletBalanceRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<GetWalletBalanceResponse> {
  try {
    const { ownerType, ownerId } = data;
    const finalOwnerType = ownerType || (authenticatedUserType === 'barber' ? 'barber' : 'customer');
    const finalOwnerId = ownerId || authenticatedUserId;

    const wallet = await getOrCreateWallet(finalOwnerType, finalOwnerId);

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
 * Deposit service
 * For wallet method: immediately processes transaction
 * For online/card method: creates pending transaction (payment gateway handles completion)
 */
export async function depositService(
  data: DepositRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<DepositResponse> {
  try {
    const { amount, method, reference, metadata } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const ownerType = authenticatedUserType === 'barber' ? 'barber' : 'customer';
    const wallet = await getOrCreateWallet(ownerType, authenticatedUserId);

    // Create external transaction
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: ownerType,
        initiatorId: authenticatedUserId,
        kind: 'deposit',
        amount: new Decimal(amount),
        method: method as any,
        status: method === 'wallet' ? 'success' : 'pending', // Wallet is immediate, online needs gateway
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

      // Update owner's cached balance
      if (ownerType === 'customer') {
        await prisma.customer.update({
          where: { id: authenticatedUserId },
          data: {
            walletBalance: newBalance,
            updated: BigInt(Date.now()),
          },
        });
      } else if (ownerType === 'barber') {
        await prisma.barber.update({
          where: { id: authenticatedUserId },
          data: {
            walletBalance: newBalance,
            updated: BigInt(Date.now()),
          },
        });
      }

      return {
        success: true,
        message: 'واریز با موفقیت انجام شد',
        transactionId: internalTx.id,
        externalTransactionId: externalTx.id,
      };
    } else {
      // For online/card methods, create pending internal transaction
      // It will be completed when payment gateway verifies payment
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
 * Withdraw service
 */
export async function withdrawService(
  data: WithdrawRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<WithdrawResponse> {
  try {
    const { amount, method, reference, metadata } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const ownerType = authenticatedUserType === 'barber' ? 'barber' : 'customer';
    const wallet = await getOrCreateWallet(ownerType, authenticatedUserId);

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
        initiatorType: ownerType,
        initiatorId: authenticatedUserId,
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

    // Update owner's cached balance
    if (ownerType === 'customer') {
      await prisma.customer.update({
        where: { id: authenticatedUserId },
        data: {
          walletBalance: newBalance,
          updated: BigInt(Date.now()),
        },
      });
    } else if (ownerType === 'barber') {
      await prisma.barber.update({
        where: { id: authenticatedUserId },
        data: {
          walletBalance: newBalance,
          updated: BigInt(Date.now()),
        },
      });
    }

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
 * Transfer service (internal wallet to wallet)
 */
export async function transferService(
  data: TransferRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<TransferResponse> {
  try {
    const { toOwnerType, toOwnerId, amount, note } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    const fromOwnerType = authenticatedUserType === 'barber' ? 'barber' : 'customer';
    const fromWallet = await getOrCreateWallet(fromOwnerType, authenticatedUserId);
    const toWallet = await getOrCreateWallet(toOwnerType, toOwnerId);

    // Check balance
    const balance = await calculateWalletBalance(fromWallet.id);
    if (balance.lessThan(amount)) {
      return {
        success: false,
        message: 'موجودی کافی نیست',
      };
    }

    // Create external transaction (system-initiated)
    const externalTx = await prisma.externalTransaction.create({
      data: {
        initiatorType: fromOwnerType,
        initiatorId: authenticatedUserId,
        kind: 'deposit', // Transfer is treated as deposit to receiver
        amount: new Decimal(amount),
        status: 'success',
        metadata: { type: 'transfer', fromOwnerType, fromOwnerId: authenticatedUserId },
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
    const creditTx = await prisma.internalTransaction.create({
      data: {
        parentExternalTransactionId: externalTx.id,
        toWalletId: toWallet.id,
        amount: new Decimal(amount),
        direction: 'credit',
        note: note || `Transfer from ${fromOwnerType} ${authenticatedUserId}`,
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
 * Get transaction history service
 */
export async function getTransactionHistoryService(
  data: GetTransactionHistoryRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<GetTransactionHistoryResponse> {
  try {
    const { ownerType, ownerId, page = 1, limit = 20, type = 'all' } = data;
    const finalOwnerType = ownerType || (authenticatedUserType === 'barber' ? 'barber' : 'customer');
    const finalOwnerId = ownerId || authenticatedUserId;

    const wallet = await getOrCreateWallet(finalOwnerType, finalOwnerId);
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
 * Lock funds for appointment service
 */
export async function lockFundsForAppointmentService(
  data: LockFundsRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<LockFundsResponse> {
  try {
    const { appointmentId, amount, method = 'wallet' } = data;

    if (amount <= 0) {
      return {
        success: false,
        message: 'مبلغ باید بیشتر از صفر باشد',
      };
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return {
        success: false,
        message: 'نوبت یافت نشد',
      };
    }

    if (appointment.customerId !== authenticatedUserId) {
      return {
        success: false,
        message: 'شما مجاز به قفل کردن وجه برای این نوبت نیستید',
      };
    }

    const ownerType = 'customer';
    const wallet = await getOrCreateWallet(ownerType, authenticatedUserId);

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
        initiatorType: ownerType,
        initiatorId: authenticatedUserId,
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

      // Update customer cached balance
      await prisma.customer.update({
        where: { id: authenticatedUserId },
        data: {
          walletBalance: newBalance,
          updated: BigInt(Date.now()),
        },
      });
    }

    // Update appointment with payment lock reference
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentLockExternalTransactionId: externalTx.id,
        priceTotal: new Decimal(amount),
        paidAmount: method === 'wallet' ? new Decimal(amount) : new Decimal(0),
        status: method === 'wallet' ? 'paid' : 'pending',
        updated: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'وجه با موفقیت قفل شد',
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

