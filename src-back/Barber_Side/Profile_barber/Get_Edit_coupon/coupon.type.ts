export interface CouponItem {
  id: number;
  code: string;
  kind: string; // "percentage", "fixed", "free"
  value: number | null;
  usageMax: number | null;
  usageCount: number;
  expiresAt: number | null;
  serviceId: number | null;
  serviceName: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface GetCouponsResponse {
  success: boolean;
  message: string;
  data?: {
    coupons: CouponItem[];
  };
}

export interface CreateCouponRequest {
  code: string;
  kind: 'percentage' | 'fixed' | 'free';
  value?: number;
  usageMax?: number;
  expiresAt?: number; // timestamp in milliseconds
  serviceId?: number;
}

export interface CreateCouponResponse {
  success: boolean;
  message: string;
  data?: {
    coupon: CouponItem;
  };
}

export interface EditCouponRequest {
  code?: string;
  kind?: 'percentage' | 'fixed' | 'free';
  value?: number;
  usageMax?: number;
  expiresAt?: number; // timestamp in milliseconds
  serviceId?: number;
}

export interface EditCouponResponse {
  success: boolean;
  message: string;
  data?: {
    coupon: CouponItem;
  };
}

export interface SendCouponSMSRequest {
  couponId: number;
  phoneNumbers: string[]; // Array of phone numbers to send SMS to
}

export interface SendCouponSMSResponse {
  success: boolean;
  message: string;
  data?: {
    sent: number; // Number of SMS sent successfully
    failed: number; // Number of SMS failed
    results: Array<{
      phone: string;
      success: boolean;
      message?: string;
    }>;
  };
}

