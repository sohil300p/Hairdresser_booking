// Fix: Import ReactNode to resolve 'Cannot find namespace React' error.
import type { ReactNode } from 'react';

export interface Service {
  id: number;
  name: string;
  duration: number; // in minutes
  price: number;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Barber {
  id: number;
  name: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  distance: number; // in km
  priceRange: [number, number];
  isVerified: boolean;
  isOpen: boolean;
  discount?: string;
  gallery: string[];
  services: Service[];
  reviews: Review[];
  about: string;
  location: { lat: number; lng: number };
}

export enum BookingStatus {
  Confirmed = 'تایید شده',
  Completed = 'تکمیل شده',
  Canceled = 'لغو شده',
}

export interface Booking {
  id: string;
  barber: Barber;
  service: Service;
  date: string;
  time: string;
  status: BookingStatus;
  price: number;
}

export interface Transaction {
  id: string;
  booking: Booking;
  amount: number;
  date: string;
  status: 'موفق' | 'ناموفق';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface Discount {
    id: string;
    code: string;
    description: string;
    value: number; // percentage
}

export interface BankCard {
    id: string;
    last4: string;
    bankName: string;
    isVerified: boolean;
}

export interface User {
    name: string;
    phone: string;
    avatarUrl?: string;
    walletBalance: number;
    bankCards: BankCard[];
}


export type Page = 
  | 'home'
  | 'search'
  | 'barber'
  | 'booking'
  | 'my-bookings'
  | 'profile'
  | 'edit-profile'
  | 'wallet'
  | 'wallet-withdraw'
  | 'discounts'
  | 'favorites'
  | 'payment-history'
  | 'notifications'
  | 'support-center'
  | 'chat'
  | 'faq'
  | 'login';

export type ToastType = 'success' | 'error';

export type AppContextType = {
  currentPage: Page;
  setCurrentPage: (page: Page, params?: any) => void;
  selectedBarber: Barber | null;
  selectedService: Service | null;
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'status'>, paymentMethod: 'wallet') => string;
  cancelBooking: (bookingId: string) => void;
  rebook: (booking: Booking) => void;
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  showModal: (content: ReactNode, position?: 'center' | 'bottom') => void;
  hideModal: () => void;
  discounts: Discount[];
  favorites: number[];
  toggleFavorite: (barberId: number) => void;
  chargeWallet: (amount: number) => void;
  addBankCard: (card: Omit<BankCard, 'id' | 'isVerified'>) => void;
  verifyBankCard: (cardId: string, otp: string) => void;
  deleteBankCard: (cardId: string) => void;
};