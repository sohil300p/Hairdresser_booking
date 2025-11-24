import type { ReactNode } from 'react';
import type { User, ToastType } from '../shared/types/common';

export type BarberPage = 
  | 'dashboard'
  | 'appointments'
  | 'customers'
  | 'services'
  | 'schedule'
  | 'earnings'
  | 'profile'
  | 'chat'
  | 'notifications'
  | 'support'
  | 'reviews'
  | 'add-reservation';

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Appointment {
  id: number;
  name: string;
  service: string;
  time: string;
  avatar: string;
  status: AppointmentStatus;
  date: string;
  price?: string;
  customerId?: number;
}

export interface LoyaltyHistory {
  id: number;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
}

export interface Customer {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  points: number;
  history: LoyaltyHistory[];
}

export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface Schedule {
  key: string;
  name: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export interface Discount {
  id: number;
  code: string;
  percentage: number;
  description: string;
  isActive: boolean;
  applicableServices: number[];
  validFrom: string;
  validTo: string;
}

export interface EarningsData {
  name: string;
  درآمد: number;
}

export type BarberContextType = {
  currentPage: BarberPage;
  setCurrentPage: (page: BarberPage, params?: any) => void;
  user: User | null;
  login: (userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  showToast: (message: string, type?: ToastType) => void;
  showModal: (content: ReactNode, position?: 'center' | 'bottom') => void;
  hideModal: () => void;
  selectedCustomer?: Customer | null;
  setSelectedCustomer?: (customer: Customer | null) => void;
  pageParams?: any;
};
