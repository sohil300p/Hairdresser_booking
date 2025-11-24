import type { ReactNode } from 'react';

export type UserRole = 'CUSTOMER' | 'BARBER' | 'ADMIN';

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
  id?: number;
  name: string;
  phone: string;
  avatarUrl?: string;
  walletBalance: number;
  bankCards: BankCard[];
  role?: UserRole;
}

export type ToastType = 'success' | 'error' | 'info';

