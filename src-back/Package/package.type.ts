// Package Request/Response Types

export interface GetAvailablePackagesResponse {
  success: boolean;
  message: string;
  packages?: Array<{
    id: number;
    name: string;
    description: string | null;
    type: 'deposit' | 'full_payment' | 'subscription';
    price: number;
    depositAmount: number | null;
    serviceIds: number[] | null;
    active: boolean;
    validFrom: number | null;
    validUntil: number | null;
  }>;
}

export interface PurchasePackageRequest {
  packageId: number;
  paymentMethod: 'wallet' | 'online' | 'card';
}

export interface PurchasePackageResponse {
  success: boolean;
  message: string;
  purchaseId?: number;
  transactionId?: number;
}

export interface GetUserPackagesResponse {
  success: boolean;
  message: string;
  packages?: Array<{
    id: number;
    packageId: number;
    packageName: string;
    amount: number;
    used: boolean;
    expiresAt: number | null;
    createdAt: number;
  }>;
}

