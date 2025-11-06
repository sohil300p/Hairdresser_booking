import React from 'react';
import type { AppContextType } from '../types';
import { Icon, IconName } from '../components/Icon';

export const SupportCenterPage: React.FC<{ context: AppContextType }> = ({ context }) => {
    
  const SupportMenuItem: React.FC<{ icon: IconName; label: string; description: string; onClick: () => void; }> = ({ icon, label, description, onClick }) => (
    <button onClick={onClick} className="flex items-center w-full p-4 bg-white rounded-lg border border-gray-200 mb-3 text-right transition-transform transform active:scale-95">
      <div className="p-3 bg-[var(--md-sys-color-primary-container)] rounded-lg ml-4">
        <Icon name={icon} className="w-6 h-6 text-[var(--md-sys-color-primary)]" />
      </div>
      <div className="flex-grow">
          <span className="font-bold text-gray-800 text-lg">{label}</span>
          <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
        <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
            <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">مرکز پشتیبانی</h1>
        </header>

        <div className="space-y-4 px-4">
            <SupportMenuItem 
                icon="questionMarkCircle" 
                label="سوالات متداول"
                description="پاسخ به سوالات رایج شما"
                onClick={() => context.setCurrentPage('faq')} 
            />
            <SupportMenuItem 
                icon="chatBubble" 
                label="چت با پشتیبانی" 
                description="گفتگوی زنده با کارشناسان ما"
                onClick={() => context.showToast('به زودی!')} 
            />
             <SupportMenuItem 
                icon="lifeBuoy" 
                label="ارسال تیکت" 
                description="مشکل خود را ثبت کنید تا بررسی کنیم"
                onClick={() => context.showToast('به زودی!')} 
            />
        </div>
    </div>
  );
};