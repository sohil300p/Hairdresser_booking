import React, { useState, useCallback, useEffect } from 'react';
import type { AppContextType, Page, Booking, Notification, User, Discount, BankCard, ToastType } from './types';
import { BookingStatus } from './types';
import { tokenService } from './src/services/token.service';
import { authService } from './src/services/auth.service';

// New Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { BarberLoginPage } from './pages/BarberLoginPage';
import { BarberProfilePage } from './pages/BarberProfilePage';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { WalletPage } from './pages/WalletPage';
import { WalletWithdrawPage } from './pages/WalletWithdrawPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SearchPage } from './pages/SearchPage';
import { SupportCenterPage } from './pages/SupportCenterPage';
import { ChatPage } from './pages/ChatPage';
import { FaqPage } from './pages/FaqPage';

// Components
import { Icon, IconName } from './components/Icon';
import { Toast } from './components/Toast';
import { Modal } from './components/Modal';

// Constants
import { BOOKINGS, NOTIFICATIONS, LOGGED_IN_USER, DISCOUNTS, BARBERS } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [pageParams, setPageParams] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [discounts, setDiscounts] = useState<Discount[]>(DISCOUNTS);
  const [favorites, setFavorites] = useState<number[]>([1]); // Default favorite
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Check for valid token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenService.hasValidToken()) {
        try {
          const result = await authService.verifyToken();
          if (result.success && result.user) {
            // Set user from token verification
            setUser({
              name: result.user.phone,
              phone: result.user.phone,
              walletBalance: 0,
              bankCards: [],
            });
            setCurrentPage('home');
          }
        } catch (error) {
          // Token invalid, clear and show login
          tokenService.clearTokens();
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Auto-refresh token if expired
  useEffect(() => {
    const token = tokenService.getAccessToken();
    if (token && tokenService.isTokenExpired(token)) {
      authService.refreshToken().catch(() => {
        tokenService.clearTokens();
        setUser(null);
        setCurrentPage('login');
      });
    }
  }, []);

  const handleSetCurrentPage = useCallback((page: Page, params: any = null) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, []);

  const login = async (userData?: User) => {
    if (userData) {
      setUser(userData);
    } else {
      setUser(LOGGED_IN_USER);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setCurrentPage('login');
  };
  
  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
        setUser(prev => ({...prev, ...updatedUserData} as User));
        if (Object.keys(updatedUserData).join() !== 'walletBalance') {
            showToast('پروفایل شما با موفقیت به‌روز شد.', 'success');
        }
    }
  };

  const showToast = (message: string, type: ToastType = 'success') => {
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

  const addBooking = (newBookingData: Omit<Booking, 'id' | 'status'>, paymentMethod: 'wallet') => {
    const newBooking: Booking = {
      ...newBookingData,
      id: `b${bookings.length + 1}`,
      status: BookingStatus.Confirmed,
    };
    setBookings(prev => [newBooking, ...prev]);
    // Deduct from wallet
    if(user && newBookingData.price > 0) {
      updateUser({ walletBalance: user.walletBalance - newBookingData.price });
    }
    return newBooking.id;
  };

  const cancelBooking = (bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: BookingStatus.Canceled } : b));
    showToast('رزرو شما با موفقیت لغو شد.', 'success');
  };

  const rebook = (booking: Booking) => {
    handleSetCurrentPage('booking', { barber: booking.barber, service: booking.service });
  };
  
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };
  
  const toggleFavorite = (barberId: number) => {
      setFavorites(prev => 
        prev.includes(barberId) 
            ? prev.filter(id => id !== barberId)
            : [...prev, barberId]
      );
  };

  const chargeWallet = (amount: number) => {
    if(user) {
        updateUser({ walletBalance: user.walletBalance + amount });
        showToast(`کیف پول شما ${amount.toLocaleString('en-US')} تومان شارژ شد.`, 'success');
    }
  };

  const addBankCard = (card: Omit<BankCard, 'id' | 'isVerified'>) => {
      if(user) {
          const newCard: BankCard = { ...card, id: `c${user.bankCards.length + 1}`, isVerified: false };
          updateUser({ bankCards: [...user.bankCards, newCard]});
          showToast('کارت بانکی با موفقیت اضافه شد. در انتظار تایید.', 'success');
      }
  };

  const verifyBankCard = (cardId: string, otp: string) => {
    if (otp === '1234') { // Mock OTP check
        if(user) {
            const updatedCards = user.bankCards.map(c => c.id === cardId ? { ...c, isVerified: true } : c);
            updateUser({ bankCards: updatedCards });
            showToast('کارت شما با موفقیت تایید شد.', 'success');
            hideModal();
        }
    } else {
        showToast('کد وارد شده صحیح نیست.', 'error');
    }
  };

  const deleteBankCard = (cardId: string) => {
    if (user) {
        const updatedCards = user.bankCards.filter(c => c.id !== cardId);
        updateUser({ bankCards: updatedCards });
        showToast('کارت با موفقیت حذف شد.', 'success');
        hideModal(); // Close the confirmation modal
    }
  };

  const context: AppContextType = {
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    selectedBarber: pageParams?.barber,
    selectedService: pageParams?.service,
    user,
    login,
    logout,
    updateUser,
    bookings,
    addBooking,
    cancelBooking,
    rebook,
    notifications,
    markNotificationAsRead,
    showToast,
    showModal,
    hideModal,
    discounts,
    favorites,
    toggleFavorite,
    chargeWallet,
    addBankCard,
    verifyBankCard,
    deleteBankCard,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage context={context} />;
      case 'barber': return <BarberProfilePage context={context} />;
      case 'booking': return <BookingPage context={context} />;
      case 'my-bookings': return <MyBookingsPage context={context} />;
      case 'profile': return <ProfilePage context={context} />;
      case 'edit-profile': return <EditProfilePage context={context} />;
      case 'wallet': return <WalletPage context={context} />;
      case 'wallet-withdraw': return <WalletWithdrawPage context={context} />;
      case 'discounts': return <DiscountsPage context={context} />;
      case 'favorites': return <FavoritesPage context={context} barbers={BARBERS.filter(b => favorites.includes(b.id))} />;
      case 'payment-history': return <PaymentHistoryPage context={context} />;
      case 'notifications': return <NotificationsPage context={context} />;
      case 'search': return <SearchPage context={context} />;
      case 'support-center': return <SupportCenterPage context={context} />;
      case 'chat': return <ChatPage context={context} />;
      case 'faq': return <FaqPage context={context} />;
      case 'barber-login': return <BarberLoginPage context={context} />;
      case 'login': default: return <LoginPage context={context} />;
    }
  };

  const NavItem: React.FC<{ page: Page; icon: IconName; label: string }> = ({ page, icon, label }) => (
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

  const pagesWithoutNav = ['login', 'barber-login', 'booking', 'wallet-withdraw', 'chat', 'faq'];
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
                 <NavItem page="home" icon="home" label="خانه" />
                 <NavItem page="my-bookings" icon="clock" label="رزروها" />
                 <NavItem page="profile" icon="user" label="پروفایل" />
             </footer>
        )}
    </div>
  );
};

export default App;