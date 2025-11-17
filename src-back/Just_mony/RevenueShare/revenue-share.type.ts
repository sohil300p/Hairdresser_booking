// Revenue Share Request/Response Types

export interface GetRevenueShareConfigResponse {
  success: boolean;
  message: string;
  config?: {
    id: number;
    name: string;
    platformPercent: number;
    barberPercent: number;
    barbershopPercent: number | null;
    serviceType: string | null;
    active: boolean;
  };
}

export interface CalculateRevenueShareRequest {
  amount: number;
  serviceType?: string;
  configName?: string; // optional: specific config name to use
}

export interface CalculateRevenueShareResponse {
  success: boolean;
  message: string;
  breakdown?: {
    total: number;
    platformShare: number;
    barberShare: number;
    barbershopShare: number | null;
    platformPercent: number;
    barberPercent: number;
    barbershopPercent: number | null;
  };
}

