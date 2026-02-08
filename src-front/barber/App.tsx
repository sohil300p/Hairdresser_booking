
import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, User, MessageSquare, Users, CheckCircle, XCircle, Info, X, Gift, Mic, UserPlus } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import HomeScreen from './components/HomeScreen';
import ReservationsScreen from './components/ReservationsScreen';
import ProfileScreen from './components/ProfileScreen';
import ChatScreen from './components/ChatScreen';
import NotificationsScreen from './components/NotificationsScreen';
import CustomersScreen from './components/CustomersScreen';
import SupportScreen from './components/SupportScreen';
import VoiceControl from './components/VoiceControl';
import AddReservationScreen from './components/AddReservationScreen';
import CustomerReviewsScreen from './components/CustomerReviewsScreen';
import CustomerClubScreen from './components/CustomerClubScreen';
import { api, setAuthHandlers } from './utils/api';
import { requestForToken, onMessageListener } from './utils/firebase';
import type { PendingInviteItem } from './types/api';

// Added 'club' to the list of available screens to support the customer club feature.
export type Screen = 'home' | 'reservations' | 'customers' | 'profile' | 'chat' | 'notifications' | 'support' | 'addReservation' | 'reviews' | 'club';

// Toast Notification System Types and Logic
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

declare global {
    interface Window {
        showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    }
}

const ToastMessage: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 4000); // Auto-dismiss after 4 seconds

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const icons = {
        success: <CheckCircle className="w-6 h-6 text-success-500" />,
        error: <XCircle className="w-6 h-6 text-error-500" />,
        info: <Info className="w-6 h-6 text-info-500" />,
    };

    return (
        <div className="bg-surface-container rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-down overflow-hidden relative max-w-sm w-full border border-surface-3">
            {icons[toast.type]}
            <p className="text-on-surface font-semibold">{toast.message}</p>
            <button onClick={() => onRemove(toast.id)} className="mr-auto text-on-surface-variant hover:text-on-surface">
                <X size={18} />
            </button>
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 left-5 right-5 z-[100] space-y-2 flex flex-col items-center" style={{paddingTop: 'env(safe-area-inset-top)'}}>
            {toasts.map(toast => (
                <ToastMessage key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<'loading' | 'auth' | 'profile_setup' | 'app'>('loading');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [isSubPageActive, setIsSubPageActive] = useState(false);
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isVoiceAssistantEnabled, setIsVoiceAssistantEnabled] = useState(false);
  const [isAutoConfirmEnabled, setIsAutoConfirmEnabled] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteItem[]>([]);
  const voiceStartRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Initialize API handlers for logout/error handling
    setAuthHandlers(handleLogout, (message, type) => {
      window.showToast(message, type);
    });

    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      const t = setTimeout(() => {
        if (!cancelled) setAppState('auth');
      }, 1500);
      return () => { cancelled = true; clearTimeout(t); };
    }

    (async () => {
      await new Promise(r => setTimeout(r, 800));
      if (cancelled) return;
      try {
        const res = await api.get<{ success: boolean; data?: unknown }>('/barber/profile');
        if (cancelled) return;
        if (res?.success && res?.data) {
          setAppState('app');
          requestForToken();
          onMessageListener().then((payload: any) => {
            window.showToast(payload?.notification?.title || 'New Message', 'info');
          }).catch(() => {});
        } else {
          setAppState('profile_setup');
        }
      } catch {
        if (!cancelled) setAppState('profile_setup');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.showToast = (message, type = 'info') => {
        const newToast: Toast = {
            id: Date.now(),
            message,
            type,
        };
        setToasts(prevToasts => [...prevToasts, newToast]);
    };
  }, []);

  useEffect(() => {
    if (appState !== 'app') return;
    let cancelled = false;
    api.get<{ success: boolean; invitations?: PendingInviteItem[] }>('/barber/invitations')
      .then((res) => {
        if (!cancelled && res.success && res.invitations?.length) setPendingInvites(res.invitations);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [appState]);

  useEffect(() => {
      const screensWithoutNav: Screen[] = ['addReservation', 'reviews', 'support', 'notifications', 'club'];
      setShowNav(!screensWithoutNav.includes(activeScreen));
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== 'profile' && isSubPageActive) {
      setIsSubPageActive(false);
    }
  }, [activeScreen, isSubPageActive]);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const handleLoginSuccess = (token: string) => {
    // Token is already stored in localStorage by LoginScreen
    // After login, new users are sent to profile setup.
    // TODO: Check if user is new based on API response and route accordingly
    setAppState('profile_setup');
  };

  const handleProfileSetupComplete = () => {
      setAppState('app');
      window.showToast('پروفایل شما با موفقیت تکمیل شد!', 'success');
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/barber/logout', { refreshToken });
      }
    } catch {
      // On 401, network error, or any failure: still clear tokens locally
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setAppState('auth');
      window.showToast('شما با موفقیت خارج شدید.', 'info');
    }
  };

  const handleCustomerSelect = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setActiveScreen('customers');
  };

  const handleCustomerDetailBack = () => {
    setSelectedCustomerId(null);
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/barber/invitations/${token}/accept`, {});
      if (res.success) {
        setPendingInvites((prev) => prev.filter((i) => i.token !== token));
        window.showToast(res.message || 'به سالن پیوستید', 'success');
        if (typeof window !== 'undefined' && window.history.replaceState) {
          const u = new URL(window.location.href);
          u.searchParams.delete('invite');
          window.history.replaceState({}, '', u.toString());
        }
      } else {
        window.showToast(res.message || 'خطا در پذیرش دعوت', 'error');
      }
    } catch (err: unknown) {
      window.showToast(err instanceof Error ? err.message : 'خطا در پذیرش دعوت', 'error');
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            setActiveScreen={setActiveScreen}
            onCustomerSelect={handleCustomerSelect}
            onRequireOnboarding={() => setAppState('profile_setup')}
          />
        );
      case 'reservations':
        return <ReservationsScreen setActiveScreen={setActiveScreen} isAutoConfirmEnabled={isAutoConfirmEnabled} />;
      case 'customers':
        return <CustomersScreen initialCustomerId={selectedCustomerId} onDetailBack={handleCustomerDetailBack} />;
      case 'profile':
        return <ProfileScreen 
                  onLogout={handleLogout}
                  setIsSubPageActive={setIsSubPageActive}
                  isLargeFont={isLargeFont} 
                  setIsLargeFont={setIsLargeFont} 
                  isHighContrast={isHighContrast} 
                  setIsHighContrast={setIsHighContrast}
                  isVoiceAssistantEnabled={isVoiceAssistantEnabled}
                  setIsVoiceAssistantEnabled={setIsVoiceAssistantEnabled}
                  isAutoConfirmEnabled={isAutoConfirmEnabled}
                  setIsAutoConfirmEnabled={setIsAutoConfirmEnabled}
                  setActiveScreen={setActiveScreen}
                />;
      case 'chat':
        return <ChatScreen />;
      case 'notifications':
        return <NotificationsScreen setActiveScreen={setActiveScreen} />;
      case 'support':
        return <SupportScreen setActiveScreen={setActiveScreen} />;
      case 'addReservation':
        return <AddReservationScreen setActiveScreen={setActiveScreen} />;
      case 'reviews':
        return <CustomerReviewsScreen setActiveScreen={setActiveScreen} />;
      case 'club':
        return <CustomerClubScreen setActiveScreen={setActiveScreen} />;
      default:
        return (
          <HomeScreen
            setActiveScreen={setActiveScreen}
            onCustomerSelect={handleCustomerSelect}
            onRequireOnboarding={() => setAppState('profile_setup')}
          />
        );
    }
  };

  if (appState === 'loading') {
    return <SplashScreen />;
  }

  if (appState === 'auth') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (appState === 'profile_setup') {
      return <ProfileSetupScreen onSetupComplete={handleProfileSetupComplete} />;
  }

  return (
    <div 
      className={`bg-surface-2 min-h-screen font-sans text-on-surface ${isLargeFont ? 'text-scaling' : ''}`}
      data-theme={isHighContrast ? 'high-contrast' : 'default'}
    >
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen flex flex-col bg-surface-container shadow-2xl">
        {isVoiceAssistantEnabled && (
          <VoiceControl
            setActiveScreen={setActiveScreen}
            registerStart={(fn) => { voiceStartRef.current = fn; }}
          />
        )}
        <div className={`flex-grow ${showNav && !isSubPageActive ? 'pb-20' : ''}`}>
          {appState === 'app' && pendingInvites.length > 0 && (
            <div className="bg-primary-100 border-b border-primary-200 px-4 py-3 space-y-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
              <p className="text-sm font-semibold text-primary-900 flex items-center gap-2">
                <UserPlus size={18} />
                دعوت به پنل سالن
              </p>
              {pendingInvites.map((inv) => (
                <div key={inv.token} className="flex items-center justify-between gap-3 bg-white rounded-lg p-3 border border-primary-200">
                  <span className="text-sm font-medium text-gray-800">{inv.barbershopName}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptInvite(inv.token)}
                      className="px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
                    >
                      پذیرش
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingInvites((prev) => prev.filter((i) => i.token !== inv.token))}
                      className="px-3 py-1.5 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
                    >
                      بعداً
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderScreen()}
        </div>
        {showNav && !isSubPageActive && (
          <BottomNavigation
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            isVoiceAssistantEnabled={isVoiceAssistantEnabled}
            onVoiceStart={() => voiceStartRef.current()}
          />
        )}
      </div>
    </div>
  );
};

interface BottomNavigationProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  isVoiceAssistantEnabled: boolean;
  onVoiceStart: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeScreen,
  setActiveScreen,
  isVoiceAssistantEnabled,
  onVoiceStart,
}) => {
  const leftItems = [
    { id: 'customers', icon: Users, label: 'مشتریان' },
    { id: 'reservations', icon: Calendar, label: 'رزروها' },
    { id: 'home', icon: Home, label: 'خانه' },
  ];
  const rightItems = isVoiceAssistantEnabled
    ? [{ id: 'profile', icon: User, label: 'پروفایل' }]
    : [
        { id: 'chat', icon: MessageSquare, label: 'چت' },
        { id: 'profile', icon: User, label: 'پروفایل' },
      ];
  const voiceLabel = 'دستیار صوتی';
  const voiceDescription = 'اپلیکیشن را با دستورات صوتی کنترل کنید.';

  const navButton = (item: { id: string; icon: React.ElementType; label: string }, isActive: boolean, onClick: () => void) => (
    <button
      key={item.id}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center transition-colors duration-300 ease-in-out w-full gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 rounded-lg ${
        isActive ? 'text-primary-600' : 'text-on-surface-variant hover:text-primary-600'
      }`}
      aria-label={item.label}
      aria-current={isActive}
    >
      <div className={`absolute top-1/2 -translate-y-1/2 h-8 transition-all duration-300 ease-in-out ${isActive ? 'bg-primary-container w-16 rounded-full' : 'w-0 group-hover:bg-gray-200 group-hover:w-16 rounded-full'}`} />
      <div className="relative z-10 flex flex-col items-center justify-center gap-1">
        <item.icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-xs font-medium">{item.label}</span>
      </div>
    </button>
  );

  const showVoiceBubble = isVoiceAssistantEnabled;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container/80 backdrop-blur-md border-t border-surface-3 shadow-[0_-2px_12px_rgba(15,20,25,0.06)] max-w-xl mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-stretch h-16 gap-0 relative">
        {leftItems.map((item) => navButton(item, activeScreen === item.id, () => setActiveScreen(item.id as Screen)))}
        {showVoiceBubble && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center z-10">
            <button
              type="button"
              title={voiceDescription}
              onClick={onVoiceStart}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 ease-in-out hover:scale-110 bg-primary-600 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
              aria-label={voiceLabel}
            >
              <Mic className="w-7 h-7" strokeWidth={2.5} />
              <span className="sr-only">{voiceDescription}</span>
            </button>
          </div>
        )}
        {rightItems.map((item) => navButton(item, activeScreen === item.id, () => setActiveScreen(item.id as Screen)))}
      </div>
    </nav>
  );
};

export default App;
