import React, { useState, useCallback, useEffect } from 'react';
import type { AdminContextType, AdminPage, User } from './types';
import { tokenService } from '../shared/services/token.service';
import { authService } from './services/auth.service';

// Admin Pages
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { BarbersPage } from './pages/BarbersPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { SettingsPage } from './pages/SettingsPage';

// Shared Components
import { Icon, IconName } from '../shared/components/Icon';
import { Toast } from '../shared/components/Toast';
import { Modal } from '../shared/components/Modal';

interface AdminAppProps {
  onLogout: () => void;
  onRoleChange?: (role: string) => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onLogout, onRoleChange }) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
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
            if (result.user.role !== 'ADMIN') {
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

  const handleSetCurrentPage = useCallback((page: AdminPage, params: any = null) => {
    setCurrentPage(page);
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

  const context: AdminContextType = {
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    user,
    login,
    logout,
    updateUser,
    showToast,
    showModal,
    hideModal,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage context={context} />;
      case 'users': return <UsersPage context={context} />;
      case 'barbers': return <BarbersPage context={context} />;
      case 'appointments': return <AppointmentsPage context={context} />;
      case 'settings': return <SettingsPage context={context} />;
      default: return <DashboardPage context={context} />;
    }
  };

  const NavItem: React.FC<{ page: AdminPage; icon: IconName; label: string }> = ({ page, icon, label }) => (
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

  const pagesWithoutNav: AdminPage[] = [];
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
                 <NavItem page="dashboard" icon="home" label="داشبورد" />
                 <NavItem page="users" icon="user" label="کاربران" />
                 <NavItem page="barbers" icon="user" label="آرایشگران" />
                 <NavItem page="appointments" icon="clock" label="رزروها" />
                 <NavItem page="settings" icon="lifeBuoy" label="تنظیمات" />
             </footer>
        )}
    </div>
  );
};

