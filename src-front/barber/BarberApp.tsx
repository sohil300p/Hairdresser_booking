import React, { useState, useCallback, useEffect, Suspense } from 'react';
import type { BarberContextType, BarberPage, User } from './types';
import { tokenService } from '../shared/services/token.service';
import { authService } from './services/auth.service';

// Barber Pages - lazy loaded to avoid breaking initial load
import { lazy } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const EarningsPage = lazy(() => import('./pages/EarningsPage').then(m => ({ default: m.EarningsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const AddReservationPage = lazy(() => import('./pages/AddReservationPage').then(m => ({ default: m.AddReservationPage })));

// Shared Components
import { Icon, IconName } from '../shared/components/Icon';
import { Toast } from '../shared/components/Toast';
import { Modal } from '../shared/components/Modal';

interface BarberAppProps {
  onLogout: () => void;
  onRoleChange?: (role: string) => void;
}

export const BarberApp: React.FC<BarberAppProps> = ({ onLogout, onRoleChange }) => {
  const [currentPage, setCurrentPage] = useState<BarberPage>('dashboard');
  const [pageParams, setPageParams] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (tokenService.hasValidToken()) {
        try {
          const result = await authService.verifyToken();
          if (result.success && result.user) {
            if (result.user.role !== 'BARBER') {
              onRoleChange?.(result.user.role);
              return;
            }
            setUser({
              id: result.user.id,
              name: result.user.phone,
              phone: result.user.phone,
              walletBalance: 0,
              bankCards: [],
              role: result.user.role,
            });
            setCurrentPage('dashboard');
          }
        } catch (error) {
          tokenService.clearTokens();
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [onRoleChange]);

  const handleSetCurrentPage = useCallback((page: BarberPage, params: any = null) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, []);

  const login = async (userData?: User) => {
    if (userData) {
      setUser(userData);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    onLogout();
  };
  
  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
        setUser(prev => ({...prev, ...updatedUserData} as User));
        showToast('پروفایل شما با موفقیت به‌روز شد.', 'success');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };
  
  const showModal = (content: React.ReactNode, position: 'center' | 'bottom' = 'center') => {
    setModalContent(content);
    setModalPosition(position);
    setIsModalOpen(true);
  };
  
  const hideModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const context: BarberContextType = {
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    user,
    login,
    logout,
    updateUser,
    showToast,
    showModal,
    hideModal,
    selectedCustomer,
    setSelectedCustomer,
    pageParams,
  };

  const renderPage = () => {
    const LoadingFallback = () => (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );

    switch (currentPage) {
      case 'dashboard': return <Suspense fallback={<LoadingFallback />}><DashboardPage context={context} /></Suspense>;
      case 'appointments': return <Suspense fallback={<LoadingFallback />}><AppointmentsPage context={context} /></Suspense>;
      case 'customers': return <Suspense fallback={<LoadingFallback />}><CustomersPage context={context} /></Suspense>;
      case 'services': return <Suspense fallback={<LoadingFallback />}><ServicesPage context={context} /></Suspense>;
      case 'schedule': return <Suspense fallback={<LoadingFallback />}><SchedulePage context={context} /></Suspense>;
      case 'earnings': return <Suspense fallback={<LoadingFallback />}><EarningsPage context={context} /></Suspense>;
      case 'profile': return <Suspense fallback={<LoadingFallback />}><ProfilePage context={context} /></Suspense>;
      case 'chat': return <Suspense fallback={<LoadingFallback />}><ChatPage context={context} /></Suspense>;
      case 'notifications': return <Suspense fallback={<LoadingFallback />}><NotificationsPage context={context} /></Suspense>;
      case 'support': return <Suspense fallback={<LoadingFallback />}><SupportPage context={context} /></Suspense>;
      case 'reviews': return <Suspense fallback={<LoadingFallback />}><ReviewsPage context={context} /></Suspense>;
      case 'add-reservation': return <Suspense fallback={<LoadingFallback />}><AddReservationPage context={context} /></Suspense>;
      default: return <Suspense fallback={<LoadingFallback />}><DashboardPage context={context} /></Suspense>;
    }
  };

  const NavItem: React.FC<{ page: BarberPage; icon: IconName; label: string }> = ({ page, icon, label }) => (
    <div
      onClick={() => context.setCurrentPage(page)}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors cursor-pointer ${
        context.currentPage === page ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'
      }`}
    >
      <Icon name={icon} className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  const pagesWithoutNav: BarberPage[] = ['schedule', 'services', 'chat', 'notifications', 'support', 'reviews', 'add-reservation'];
  const showNav = user && !pagesWithoutNav.includes(currentPage);

  if (isCheckingAuth) {
    return (
      <div className="max-w-md mx-auto bg-white font-sans h-screen flex items-center justify-center">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white font-sans">
        <Modal isOpen={isModalOpen} onClose={hideModal} position={modalPosition}>
            {modalContent}
        </Modal>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <main className={showNav ? "pb-20" : ""}>{renderPage()}</main>
        {showNav && (
             <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around h-16 items-center" dir="rtl">
                 <NavItem page="customers" icon="user" label="مشتریان" />
                 <NavItem page="appointments" icon="clock" label="نوبت‌ها" />
                 <NavItem page="dashboard" icon="home" label="داشبورد" />
                 <NavItem page="chat" icon="message" label="چت" />
                 <NavItem page="profile" icon="user" label="پروفایل" />
             </footer>
        )}
    </div>
  );
};

