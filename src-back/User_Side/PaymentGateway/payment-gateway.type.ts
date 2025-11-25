// Payment Gateway Request/Response Types

export interface ZarrinPalPaymentRequest {
  amount: number; // in Rial
  description: string;
  callbackUrl: string;
  mobile?: string; // optional customer mobile
  email?: string; // optional customer email
  metadata?: Record<string, any>;
}

export interface ZarrinPalPaymentResponse {
  success: boolean;
  message: string;
  authority?: string; // payment authority code
  paymentUrl?: string; // URL to redirect user for payment
  status?: number; // ZarrinPal status code
}

export interface ZarrinPalVerifyRequest {
  authority: string;
  amount: number; // in Rial
}

export interface ZarrinPalVerifyResponse {
  success: boolean;
  message: string;
  refId?: string; // ZarrinPal reference ID
  status?: number; // ZarrinPal status code
  cardHash?: string;
  cardPan?: string;
}

