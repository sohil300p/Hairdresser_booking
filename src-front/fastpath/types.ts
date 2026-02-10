import type { ReactNode } from 'react';

export interface User {
  name: string;
  phone: string;
  avatarUrl?: string;
  walletBalance?: number;
  gender?: 'male' | 'female';
}


export type Page =
  | 'fastpath-landing'
  | 'fastpath-reserve'
  | 'fastpath-follow-up'
  | 'confirmation';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type AppContextType = {
  currentPage: Page;
  setCurrentPage: (page: Page, params?: FastPathParams) => void;
  pageParams: FastPathParams | null;
  user: User | null;
  login: (user: User, token: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  showModal: (content: ReactNode, position?: 'center' | 'bottom') => void;
  hideModal: () => void;
};

export interface FastPathParams {
  ref?: string;
  barbershopId?: number;
  barbershopName?: string;
  appointmentId?: number;
}

export interface ReservationLookupResult {
  id: number;
  status: string;
  date: string;
  time: string;
  barbershopName?: string;
  serviceName?: string;
}

export interface BarbershopSearchResult {
  id: number;
  name: string;
  avatar: string | null;
  address: string | null;
  averageRating: number;
  priceFrom: number | null;
  isOpen: boolean;
}

export interface ServiceItemApi {
  id: number;
  name: string;
  price: number | null;
  estimatedTime: number;
  gender: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}