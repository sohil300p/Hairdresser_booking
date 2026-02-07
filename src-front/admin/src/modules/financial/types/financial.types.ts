export type WalletOwnerType = 'customer' | 'barber' | 'barbershop';

export interface WalletSummary {
  ownerType: WalletOwnerType;
  totalBalance: number;
  count: number;
}

export interface FinancialMetrics {
  totalBalances: Record<WalletOwnerType, number>;
  totalTransactionCount: number;
  recentTransactionCount: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  walletId: number;
  createdAt: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionFilters {
  ownerType?: WalletOwnerType;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FinancialApiResponse<T> {
  success: boolean;
  data: T;
}
