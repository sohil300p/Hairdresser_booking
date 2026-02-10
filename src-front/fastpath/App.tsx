import React, { useState, useEffect, useCallback } from 'react';
import type { AppContextType, Page, User, ToastType } from './types';
import './index.css';
import { Toast } from './components/Toast';
import { Modal } from './components/Modal';
import { FastPathLandingPage } from './pages/FastPathLandingPage';
import { FastPathReservePage } from './pages/FastPathReservePage';
import { FastPathFollowUpPage } from './pages/FastPathFollowUpPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { api } from './utils/api';

function getRefFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || params.get('id') || null;
}

function getPaymentCallbackFromUrl(): { success: boolean; appointmentId?: number } | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname || '';
  const params = new URLSearchParams(window.location.search);
  const appointmentIdParam = params.get('appointmentId');
  const appointmentId = appointmentIdParam ? parseInt(appointmentIdParam, 10) : undefined;
  if (path.includes('payment/success') && !isNaN(appointmentId as number)) {
    return { success: true, appointmentId };
  }
  if (path.includes('payment/success')) return { success: true, appointmentId };
  if (path.includes('payment/failed') || path.includes('payment/error')) {
    return { success: false };
  }
  return null;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState<Page>('fastpath-landing');
  const [pageParams, setPageParams] = useState<{ ref?: string; barbershopId?: number; barbershopName?: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);
  const showModal = useCallback((content: React.ReactNode, position: 'center' | 'bottom' = 'center') => {
    setModalContent(content);
    setModalPosition(position);
    setIsModalOpen(true);
  }, []);
  const hideModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContent(null);
  }, []);
  const login = useCallback((userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);
  const setPage = useCallback((page: Page, params?: { ref?: string; barbershopId?: number; barbershopName?: string; appointmentId?: number } | null) => {
    setCurrentPage(page);
    setPageParams(params ?? null);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const payment = getPaymentCallbackFromUrl();
    if (payment) {
      if (payment.success && payment.appointmentId) {
        setPageParams({ appointmentId: payment.appointmentId });
        setCurrentPage('confirmation');
      } else {
        setCurrentPage('fastpath-landing');
        setToast({ message: 'پرداخت انجام نشد یا با خطا مواجه شد.', type: 'error' });
      }
      window.history.replaceState({}, '', window.location.pathname.replace(/\/payment\/.*$/, '') || '/');
      return;
    }
    const ref = getRefFromUrl();
    if (!ref) {
      setCurrentPage('fastpath-landing');
      return;
    }
    api
      .get<{ success: boolean; barbershopId?: number; barbershopName?: string }>(`/fastpath/resolve?ref=${encodeURIComponent(ref)}`)
      .then((res) => {
        if (res.success && res.barbershopId) {
          setPageParams({ ref, barbershopId: res.barbershopId, barbershopName: res.barbershopName ?? undefined });
          setCurrentPage('fastpath-reserve');
        } else {
          setCurrentPage('fastpath-landing');
        }
      })
      .catch(() => {
        setCurrentPage('fastpath-landing');
      });
  }, []);

  const context: AppContextType = {
    currentPage,
    setCurrentPage: setPage,
    pageParams,
    user,
    login,
    showToast,
    showModal,
    hideModal,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'fastpath-landing':
        return <FastPathLandingPage context={context} />;
      case 'fastpath-reserve':
        return <FastPathReservePage context={context} />;
      case 'fastpath-follow-up':
        return <FastPathFollowUpPage context={context} />;
      case 'confirmation':
        return <ConfirmationPage context={context} />;
      default:
        return <FastPathLandingPage context={context} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white font-sans min-h-screen" dir="rtl">
      <Modal isOpen={isModalOpen} onClose={hideModal} position={modalPosition}>
        {modalContent}
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main>{renderPage()}</main>
    </div>
  );
};

export default App;
