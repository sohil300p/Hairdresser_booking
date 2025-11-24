import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { UserRole } from './shared/types/common';
import { tokenService } from './shared/services/token.service';
import { authService } from './user/services/auth.service';

// Role-specific Apps - lazy loaded
const UserApp = lazy(() => import('./user/UserApp').then(m => ({ default: m.UserApp })));
const BarberApp = lazy(() => import('./barber/BarberApp').then(m => ({ default: m.BarberApp })));
const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

// Login Pages
import { LoginPage } from './pages/LoginPage';
import { BarberLoginPage } from './pages/BarberLoginPage';

// Shared Components
import { Toast } from './shared/components/Toast';
import { Modal } from './shared/components/Modal';

type AppState = 'login' | 'barber-login' | 'user' | 'barber' | 'admin';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (tokenService.hasValidToken()) {
          try {
            const result = await authService.verifyToken();
            if (result.success && result.user) {
              const role = result.user.role;
              setUserRole(role);
              switch (role) {
                case 'CUSTOMER':
                  setAppState('user');
                  break;
                case 'BARBER':
                  setAppState('barber');
                  break;
                case 'ADMIN':
                  setAppState('admin');
                  break;
                default:
                  setAppState('login');
              }
            } else {
              setAppState('login');
            }
          } catch (error) {
            console.error('Auth verification error:', error);
            tokenService.clearTokens();
            setAppState('login');
          }
        } else {
          setAppState('login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAppState('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    setAppState('login');
    setUserRole(null);
  };

  const handleRoleChange = (role: string) => {
    const userRole = role as UserRole;
    setUserRole(userRole);
    switch (userRole) {
      case 'CUSTOMER':
        setAppState('user');
        break;
      case 'BARBER':
        setAppState('barber');
        break;
      case 'ADMIN':
        setAppState('admin');
        break;
      default:
        setAppState('login');
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

  const handleLoginSuccess = (user: any, role: string) => {
    handleRoleChange(role);
  };

  const loginContext = {
    currentPage: appState === 'barber-login' ? 'barber-login' : 'login',
    setCurrentPage: (page: string) => {
      if (page === 'barber-login') {
        setAppState('barber-login');
      } else if (page === 'login') {
        setAppState('login');
      }
    },
    selectedBarber: null,
    selectedService: null,
    user: null,
    login: async (userData?: any) => {
      if (userData?.role) {
        handleRoleChange(userData.role);
      }
    },
    logout: handleLogout,
    updateUser: () => {},
    bookings: [],
    addBooking: () => '',
    cancelBooking: () => {},
    rebook: () => {},
    notifications: [],
    markNotificationAsRead: () => {},
    showToast,
    showModal,
    hideModal,
    discounts: [],
    favorites: [],
    toggleFavorite: () => {},
    chargeWallet: () => {},
    addBankCard: () => {},
    verifyBankCard: () => {},
    deleteBankCard: () => {},
  };

  if (isCheckingAuth) {
    return (
      <div className="max-w-md mx-auto bg-white font-sans h-screen flex items-center justify-center">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (appState) {
        case 'login':
          return <LoginPage context={loginContext as any} onLoginSuccess={handleLoginSuccess} />;
        case 'barber-login':
          return <BarberLoginPage context={loginContext as any} onLoginSuccess={handleLoginSuccess} />;
        case 'user':
          return <UserApp onLogout={handleLogout} onRoleChange={handleRoleChange} />;
        case 'barber':
          return <BarberApp onLogout={handleLogout} onRoleChange={handleRoleChange} />;
        case 'admin':
          return <AdminApp onLogout={handleLogout} onRoleChange={handleRoleChange} />;
        default:
          return <LoginPage context={loginContext as any} onLoginSuccess={handleLoginSuccess} />;
      }
    } catch (error) {
      console.error('Render error:', error);
      return (
        <div className="h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">خطا در بارگذاری</h1>
            <p className="text-gray-600">لطفا صفحه را رفرش کنید.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              رفرش صفحه
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white font-sans min-h-screen">
      <Modal isOpen={isModalOpen} onClose={hideModal} position={modalPosition}>
        {modalContent}
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main>
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">در حال بارگذاری...</div>
          </div>
        }>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
