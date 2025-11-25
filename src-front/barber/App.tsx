
import React, { useState, useEffect } from 'react';
import { Home, Calendar, User, MessageSquare, Users, CheckCircle, XCircle, Info, X, Gift } from 'lucide-react';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      // For demonstration, we go to 'auth'. In a real app, you'd check for a saved token.
      setAppState('auth');
    }, 1500); // Splash screen duration reduced for better perceived performance
    return () => clearTimeout(timer);
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

  const handleLoginSuccess = () => {
    // After login, new users are sent to profile setup.
    setAppState('profile_setup');
  };

  const handleProfileSetupComplete = () => {
      setAppState('app');
      window.showToast('پروفایل شما با موفقیت تکمیل شد!', 'success');
  };

  const handleLogout = () => {
    setAppState('auth');
    window.showToast('شما با موفقیت خارج شدید.', 'info');
  };

  const handleCustomerSelect = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setActiveScreen('customers');
  };

  const handleCustomerDetailBack = () => {
    setSelectedCustomerId(null);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen setActiveScreen={setActiveScreen} onCustomerSelect={handleCustomerSelect} />;
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
        return <HomeScreen setActiveScreen={setActiveScreen} onCustomerSelect={handleCustomerSelect} />;
    }
  };

  if (appState === 'loading') {
    return <SplashScreen />;
  }

  if (appState === 'auth') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (appState === 'profile_setup') {
      return <ProfileSetupScreen onSetupComplete={handleProfileSetupComplete} />
  }

  return (
    <div 
      className={`bg-surface-2 min-h-screen font-sans text-on-surface ${isLargeFont ? 'text-scaling' : ''}`}
      data-theme={isHighContrast ? 'high-contrast' : 'default'}
    >
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="container mx-auto max-w-lg min-h-screen flex flex-col bg-surface-container shadow-2xl">
        {isVoiceAssistantEnabled && <VoiceControl setActiveScreen={setActiveScreen} />}
        <div className={`flex-grow ${showNav && !isSubPageActive ? 'pb-20' : ''}`}>
          {renderScreen()}
        </div>
        {showNav && !isSubPageActive && <BottomNavigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />}
      </div>
    </div>
  );
};

interface BottomNavigationProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems = [
    { id: 'customers', icon: Users, label: 'مشتریان' },
    { id: 'reservations', icon: Calendar, label: 'رزروها' },
    { id: 'home', icon: Home, label: 'خانه' },
    { id: 'chat', icon: MessageSquare, label: 'چت' },
    { id: 'profile', icon: User, label: 'پروفایل' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container/80 backdrop-blur-md border-t border-surface-3 shadow-[0_-2px_12px_rgba(15,20,25,0.06)] max-w-lg mx-auto" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <div className="flex justify-around items-stretch h-16">
        {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id as Screen)}
                className={`relative flex flex-col items-center justify-center transition-colors duration-300 ease-in-out w-full gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 rounded-lg ${
                  isActive ? 'text-primary-600' : 'text-on-surface-variant hover:text-primary-600'
                }`}
                aria-label={item.label}
                aria-current={isActive}
              >
                <div className={`absolute top-1/2 -translate-y-1/2 h-8 transition-all duration-300 ease-in-out ${isActive ? 'bg-primary-container w-16 rounded-full' : 'w-0 group-hover:bg-gray-200 group-hover:w-16 rounded-full'}`}></div>
                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                    <item.icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-xs font-medium">{item.label}</span>
                </div>
              </button>
            )
        })}
      </div>
    </nav>
  );
};

export default App;
