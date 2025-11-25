export interface GetBarbershopServicesRequest {
  barbershopId: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  description: string | null;
  readmore: string | null;
  avatar: string | null;
  isVip: boolean;
  isMedical: boolean;
  gender: string;
  parentServiceId: number | null;
  addonsCount: number;
}

export interface GetBarbershopServicesResponse {
  success: boolean;
  message: string;
  data?: {
    services: ServiceItem[];
    total: number;
    viewCount: number;
  };
}

