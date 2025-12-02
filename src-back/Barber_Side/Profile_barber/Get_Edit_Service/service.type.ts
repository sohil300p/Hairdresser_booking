export interface ServiceItem {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  description: string | null;
  avatar: string | null;
  files: string[];
  gender: 'male' | 'female' | 'other';
  isVip: boolean;
  isMedical: boolean;
  parentServiceId: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface GetServicesResponse {
  success: boolean;
  message: string;
  data?: {
    services: ServiceItem[];
  };
}

export interface CreateServiceRequest {
  name: string;
  price?: number;
  estimatedTime: number;
  description?: string;
  gender: 'male' | 'female' | 'other';
  isVip?: boolean;
  isMedical?: boolean;
  parentServiceId?: number;
}

export interface CreateServiceResponse {
  success: boolean;
  message: string;
  data?: {
    service: ServiceItem;
  };
}

export interface EditServiceRequest {
  name?: string;
  price?: number;
  estimatedTime?: number;
  description?: string;
  gender?: 'male' | 'female' | 'other';
  isVip?: boolean;
  isMedical?: boolean;
}

export interface EditServiceResponse {
  success: boolean;
  message: string;
  data?: {
    service: ServiceItem;
  };
}



