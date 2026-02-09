import prisma from '../../../All_Utils/config/prisma';
import type { WalletSummary, FinancialMetrics, AdminTransactionFilters } from './financial.type';

const OWNER_TYPES = ['customer', 'barber', 'barbershop', 'system'] as const;

export async function getWalletSummariesService(): Promise<WalletSummary[]> {
  const summaries: WalletSummary[] = [];

  const [customerSum, barberSum, barbershopSum, systemWallets] = await Promise.all([
    prisma.customer.aggregate({ _sum: { wallet_balance: true }, _count: { id: true } }),
    prisma.barber.aggregate({ _sum: { walletBalance: true }, _count: { id: true } }),
    prisma.barbershop.aggregate({ _sum: { walletBalance: true }, _count: { id: true } }),
    prisma.wallet.findMany({
      where: { ownerType: 'system' },
      select: { balance: true },
    }),
  ]);

  summaries.push({
    ownerType: 'customer',
    totalBalance: Number(customerSum._sum.wallet_balance ?? 0),
    count: customerSum._count.id,
  });
  summaries.push({
    ownerType: 'barber',
    totalBalance: Number(barberSum._sum.walletBalance ?? 0),
    count: barberSum._count.id,
  });
  summaries.push({
    ownerType: 'barbershop',
    totalBalance: Number(barbershopSum._sum.walletBalance ?? 0),
    count: barbershopSum._count.id,
  });

  const systemBalance = systemWallets.reduce((sum, w) => sum + Number(w.balance ?? 0), 0);
  summaries.push({
    ownerType: 'system',
    totalBalance: systemBalance,
    count: systemWallets.length || 1,
  });

  return summaries;
}

export async function getFinancialMetricsService(): Promise<FinancialMetrics> {
  const [summaries, totalTxCount] = await Promise.all([
    getWalletSummariesService(),
    prisma.internalTransaction.count(),
  ]);

  const totalBalances: Record<string, number> = {};
  for (const s of summaries) {
    totalBalances[s.ownerType] = s.totalBalance;
  }

  const sevenDaysAgo = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTransactionCount = await prisma.internalTransaction.count({
    where: { created: { gte: sevenDaysAgo } },
  });

  return {
    totalBalances: totalBalances as FinancialMetrics['totalBalances'],
    totalTransactionCount: totalTxCount,
    recentTransactionCount,
  };
}

export async function getAdminTransactionsService(filters?: AdminTransactionFilters) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters?.ownerType) {
    const wallets = await prisma.wallet.findMany({
      where: { ownerType: filters.ownerType },
      select: { id: true },
    });
    const walletIds = wallets.map((w) => w.id);
    where.OR = [
      { fromWalletId: { in: walletIds } },
      { toWalletId: { in: walletIds } },
    ];
  }

  if (filters?.from || filters?.to) {
    const created: { gte?: bigint; lte?: bigint } = {};
    if (filters?.from) created.gte = BigInt(new Date(filters.from).getTime());
    if (filters?.to) created.lte = BigInt(new Date(filters.to).getTime());
    (where as Record<string, unknown>).created = created;
  }

  const [transactions, total] = await Promise.all([
    prisma.internalTransaction.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        parentExternal: { select: { kind: true, status: true, method: true } },
        fromWallet: { select: { ownerType: true, ownerId: true } },
        toWallet: { select: { ownerType: true, ownerId: true } },
      },
      orderBy: { created: 'desc' },
      skip,
      take: limit,
    }),
    prisma.internalTransaction.count({
      where: Object.keys(where).length ? where : undefined,
    }),
  ]);

  const formatted = transactions.map((tx) => {
    const isCredit = tx.direction === 'credit';
    const kind = tx.parentExternal.kind;
    let txType = 'transfer';
    if (kind === 'deposit' && isCredit) txType = 'deposit';
    else if (kind === 'withdrawal' && !isCredit) txType = 'withdrawal';
    else if (kind === 'appointment_lock') txType = 'lock';

    return {
      id: tx.id,
      type: txType,
      amount: Number(tx.amount),
      walletId: tx.toWalletId ?? tx.fromWalletId ?? 0,
      createdAt: new Date(Number(tx.created)).toISOString(),
      description: tx.note ?? undefined,
      metadata: {
        direction: tx.direction,
        fromWallet: tx.fromWallet
          ? { ownerType: tx.fromWallet.ownerType, ownerId: tx.fromWallet.ownerId }
          : null,
        toWallet: tx.toWallet
          ? { ownerType: tx.toWallet.ownerType, ownerId: tx.toWallet.ownerId }
          : null,
      },
    };
  });

  return {
    transactions: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
