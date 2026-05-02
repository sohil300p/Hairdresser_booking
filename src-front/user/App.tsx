import React, { useState, useCallback, useEffect } from 'react';
import type { AppContextType, Page, Booking, Notification, User, Discount, BankCard, ToastType } from './types';
import { BookingStatus } from './types';
import './index.css'; // Import global CSS with fonts
import { 
  checkLocalProfileCompleteness, 
  validateProfileFromServer, 
  getProfileAction, 
  pageRequiresCompleteProfile, 
  pageRequiresBasicProfile 
} from './utils/profileValidation';

// New Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
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
import { requestForToken, onMessageListener } from './utils/firebase';
import { getInAppNotifications, markInAppNotificationRead } from './services/inapp-notifications.service';

// Constants
import { BOOKINGS, NOTIFICATIONS, LOGGED_IN_USER, DISCOUNTS, BARBERS } from './constants';

// API Client
// API client is now handled in utils/api.ts

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Check if user is logged in (has both user data and token)
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    return (savedUser && savedToken) ? 'home' : 'login';
  });
  
  const [pageParams, setPageParams] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [discounts, setDiscounts] = useState<Discount[]>(DISCOUNTS);
  const [favorites, setFavorites] = useState<number[]>([1]); // Default favorite
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');

  // Smart profile validation - only check once per session
  const [profileChecked, setProfileChecked] = useState(false);
  
  useEffect(() => {
    if (user && !profileChecked) {
      setProfileChecked(true);
      
      // Check local profile completeness first
      const localCompleteness = checkLocalProfileCompleteness(user);
      const localAction = getProfileAction(localCompleteness);
      
      // If name or gender is missing locally, redirect immediately
      if (localAction.action === 'redirect') {
        showToast(localAction.message || 'لطفاً پروفایل خود را تکمیل کنید.', 'info');
        setCurrentPage('edit-profile');
        return;
      }
      
      // For users with local data, validate from server to ensure it's complete
      const timeoutId = setTimeout(() => {
        validateProfileFromServer().then(result => {
          if (result.success && result.completeness) {
            const action = getProfileAction(result.completeness);
            
            // Force redirect if name or gender is missing
            if (action.action === 'redirect') {
              showToast(action.message || 'لطفاً پروفایل خود را تکمیل کنید.', 'info');
              setCurrentPage('edit-profile');
            } else if (action.action === 'warn') {
              // Only show warnings if profile is mostly complete
              showToast(action.message || 'برای استفاده کامل از امکانات، پروفایل خود را تکمیل کنید.', 'warning');
            }
          }
        }).catch(error => {
          console.log('Profile validation failed silently:', error);
          // Don't show error to user, just log it
        });
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [user, profileChecked]);

  const handleSetCurrentPage = useCallback((page: Page, params: any = null) => {
    // Block navigation to any page if profile is incomplete (except edit-profile and login)
    // But allow navigation FROM edit-profile to other pages after successful save
    if (user && page !== 'edit-profile' && page !== 'login' && currentPage !== 'edit-profile') {
      const completeness = checkLocalProfileCompleteness(user);
      
      // Force redirect to profile if name is missing
      if (!completeness.hasBasicInfo) {
        showToast('لطفاً ابتدا نام خود را وارد کنید.', 'error');
        setCurrentPage('edit-profile');
        return;
      }
      
      // Force redirect to profile if gender is missing
      if (!completeness.hasGender) {
        showToast('لطفاً جنسیت خود را انتخاب کنید.', 'error');
        setCurrentPage('edit-profile');
        return;
      }
    }
    
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, [user, currentPage]);

  const login = (userData: User, token: string) => { 
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => { 
    setUser(null); 
    setCurrentPage('login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('شما از سیستم خارج شدید.', 'warning');
  };

  // Initialize API client with logout handler
  useEffect(() => {
    // API client unauthorized handler is now set in utils/api.ts
    
    // Initialize Firebase Notifications
    if (user) {
      // Load in-app notifications from backend (best-effort)
      getInAppNotifications('all')
        .then((data) => {
          const mapped: Notification[] = data.notifications.map((n) => ({
            id: String(n.id),
            title: n.title,
            message: n.body,
            date: new Date(n.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }),
            isRead: n.read,
          }));
          setNotifications(mapped);
        })
        .catch(() => {});

      // Request notification permission and register token
      requestForToken().then((token) => {
        if (token) {
          console.log('✅ Notification token obtained and registered');
        } else {
          console.log('ℹ️ Notification permission not granted or Firebase not configured');
        }
      }).catch((err) => {
        console.error('❌ Failed to request notification token:', err);
      });
      
      // Set up foreground message listener
      onMessageListener().then((payload: any) => {
        console.log('📨 Foreground notification received:', payload);
        showToast(payload?.notification?.title || payload?.data?.title || 'New Message', 'info');
        // Refresh notifications list (best-effort)
        getInAppNotifications('all')
          .then((data) => {
            const mapped: Notification[] = data.notifications.map((n) => ({
              id: String(n.id),
              title: n.title,
              message: n.body,
              date: new Date(n.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }),
              isRead: n.read,
            }));
            setNotifications(mapped);
          })
          .catch(() => {});
      }).catch(err => {
        console.log('ℹ️ Message listener not available (Firebase may not be configured):', err);
      });
    }
  }, [user]);
  
  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
        const updatedUser = {...user, ...updatedUserData} as User;
        setUser(updatedUser);
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Don't show toast for walletBalance or avatarUrl updates (they have their own specific toasts)
        const updatedKeys = Object.keys(updatedUserData).join();
        if (updatedKeys !== 'walletBalance' && updatedKeys !== 'avatarUrl') {
            showToast('پروفایل شما با موفقیت به‌روز شد.', 'success');
        }
        // Reset profileChecked to allow re-validation with new data
        setProfileChecked(false);
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
    const idNum = parseInt(notificationId, 10);
    if (!Number.isNaN(idNum)) {
      markInAppNotificationRead(idNum).catch(() => {});
    }
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
    console.log('Rendering page:', currentPage, 'User:', user ? 'logged in' : 'not logged in');
    
    try {
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
        case 'login': default: return <LoginPage context={context} />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return <div className="p-4 text-center text-red-500">خطا در بارگذاری صفحه</div>;
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

  const pagesWithoutNav = ['login', 'booking', 'wallet-withdraw', 'chat', 'faq'];
  const showNav = user && !pagesWithoutNav.includes(currentPage);

  return (
    <div className="max-w-md mx-auto bg-white font-sans">
        <Modal isOpen={isModalOpen} onClose={hideModal} position={modalPosition}>
            {modalContent}
        </Modal>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <main className={showNav ? "" : ""}>{renderPage()}</main>
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