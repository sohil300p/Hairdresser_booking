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

export interface AdminTransactionFilters {
  ownerType?: WalletOwnerType;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
