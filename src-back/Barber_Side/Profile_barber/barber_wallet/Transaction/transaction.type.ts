export interface GetWalletBalanceRequest {
  ownerType?: 'barber' | 'barbershop';
  ownerId?: number;
}

export interface GetWalletBalanceResponse {
  success: boolean;
  message: string;
  balance?: number;
  currency?: string;
}

export interface DepositRequest {
  amount: number;
  method: 'cash' | 'card' | 'online' | 'wallet';
  reference?: string;
  metadata?: any;
}

export interface DepositResponse {
  success: boolean;
  message: string;
  transactionId?: number;
  externalTransactionId?: number;
}

export interface WithdrawRequest {
  amount: number;
  method: 'cash' | 'card' | 'online' | 'wallet';
  reference?: string;
  metadata?: any;
}

export interface WithdrawResponse {
  success: boolean;
  message: string;
  transactionId?: number;
  externalTransactionId?: number;
}

export interface TransferRequest {
  toOwnerType: 'customer' | 'barber' | 'barbershop' | 'system';
  toOwnerId: number;
  amount: number;
  note?: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  transactionId?: number;
}

export interface GetTransactionHistoryRequest {
  ownerType?: 'barber' | 'barbershop';
  ownerId?: number;
  page?: number;
  limit?: number;
  type?: 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'lock';
}

export interface GetTransactionHistoryResponse {
  success: boolean;
  message: string;
  transactions?: Array<{
    id: number;
    type: 'deposit' | 'withdrawal' | 'transfer' | 'lock';
    amount: number;
    direction: 'credit' | 'debit';
    status: 'pending' | 'success' | 'failed';
    method?: string;
    note?: string;
    createdAt: number;
    relatedAppointmentId?: number;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LockFundsRequest {
  appointmentId: number;
  amount: number;
  method?: 'wallet' | 'online' | 'card';
}

export interface LockFundsResponse {
  success: boolean;
  message: string;
  transactionId?: number;
  externalTransactionId?: number;
}

