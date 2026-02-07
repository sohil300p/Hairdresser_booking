import api from '../../../services/api';
import type { WalletSummary, FinancialMetrics, FinancialApiResponse } from '../types/financial.types';

export const walletService = {
  getWalletSummaries: async (): Promise<WalletSummary[]> => {
    const response = await api.get<FinancialApiResponse<WalletSummary[]>>('/admin/financial/wallets');
    if (!response.data.success) throw new Error('Failed to fetch wallet summaries');
    return response.data.data ?? [];
  },

  getFinancialMetrics: async (): Promise<FinancialMetrics> => {
    const response = await api.get<FinancialApiResponse<FinancialMetrics>>('/admin/financial/metrics');
    if (!response.data.success) throw new Error('Failed to fetch financial metrics');
    return response.data.data;
  },
};
