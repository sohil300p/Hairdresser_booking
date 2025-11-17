// Coupon Request/Response Types

export interface ValidateCouponRequest {
  code: string;
  amount?: number; // optional: total amount to calculate discount
}

export interface ValidateCouponResponse {
  success: boolean;
  message: string;
  valid?: boolean;
  coupon?: {
    id: number;
    code: string;
    kind: string;
    value: number | null;
    discountAmount?: number; // calculated discount amount
    discountPercent?: number; // if percentage type
  };
}

export interface GetAvailableCouponsResponse {
  success: boolean;
  message: string;
  coupons?: Array<{
    id: number;
    code: string;
    kind: string;
    value: number | null;
    usageMax: number | null;
    usageCount: number;
    expiresAt: number | null;
  }>;
}

