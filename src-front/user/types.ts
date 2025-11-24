import type { ReactNode } from 'react';
import type { User, Barber, Service, Booking, Notification, Discount, BankCard, ToastType, BookingStatus } from '../shared/types/common';

export type UserPage = 
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
  | 'faq';

export type UserContextType = {
  currentPage: UserPage;
  setCurrentPage: (page: UserPage, params?: any) => void;
  selectedBarber: Barber | null;
  selectedService: Service | null;
  user: User | null;
  login: (userData?: User) => Promise<void>;
  logout: () => Promise<void>;
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


