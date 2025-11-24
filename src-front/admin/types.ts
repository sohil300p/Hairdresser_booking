import type { ReactNode } from 'react';
import type { User, ToastType } from '../shared/types/common';

export type AdminPage = 
  | 'dashboard'
  | 'users'
  | 'barbers'
  | 'appointments'
  | 'settings';

export type AdminContextType = {
  currentPage: AdminPage;
  setCurrentPage: (page: AdminPage, params?: any) => void;
  user: User | null;
  login: (userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  showToast: (message: string, type?: ToastType) => void;
  showModal: (content: ReactNode, position?: 'center' | 'bottom') => void;
  hideModal: () => void;
};

