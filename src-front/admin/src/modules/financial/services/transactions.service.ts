import api from '../../../services/api';
import type {
  Transaction,
  TransactionFilters,
  PaginatedTransactions,
  FinancialApiResponse,
} from '../types/financial.types';

export const transactionsService = {
  getTransactions: async (
    filters?: TransactionFilters
  ): Promise<PaginatedTransactions> => {
    const params = new URLSearchParams();
    if (filters?.ownerType) params.set('ownerType', filters.ownerType);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const query = params.toString();
    const url = query ? `/admin/financial/transactions?${query}` : '/admin/financial/transactions';
    const response = await api.get<FinancialApiResponse<PaginatedTransactions>>(url);
    if (!response.data.success) throw new Error('Failed to fetch transactions');
    return response.data.data;
  },
};
