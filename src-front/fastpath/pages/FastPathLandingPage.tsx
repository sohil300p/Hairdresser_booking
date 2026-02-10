import React from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';

export const FastPathLandingPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col" dir="rtl">
      {/* Hero section */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center mb-6 shadow-lg">
          <Icon name="calendar" className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-center text-[var(--md-sys-color-on-surface)] mb-2">
        رزرو سریع
        </h1>
        <p className="text-sm text-center text-[var(--md-sys-color-on-surface-variant)] max-w-xs">
          بدون نیاز به اپلیکیشن، در چند مرحله ساده...
        </p>
      </div>

      {/* Action cards */}
      <div className="flex-1 px-6 space-y-4 pb-8">
        {/* Reserve card */}
        <button
          type="button"
          onClick={() => context.setCurrentPage('fastpath-reserve')}
          className="w-full bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-right flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon name="plus" className="w-7 h-7 text-[var(--md-sys-color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">رزرو جدید</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              انتخاب آرایشگاه، سرویس، تاریخ و ساعت
            </p>
          </div>
          <Icon name="chevronLeft" className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>

        {/* Follow-up card */}
        <button
          type="button"
          onClick={() => context.setCurrentPage('fastpath-follow-up')}
          className="w-full bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-right flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Icon name="search" className="w-7 h-7 text-[var(--md-sys-color-tertiary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">پیگیری رزرو</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              بررسی وضعیت رزرو قبلی
            </p>
          </div>
          <Icon name="chevronLeft" className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>
      </div>

      {/* Flow diagram hint */}
      <div className="px-6 pb-8">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-[var(--md-sys-color-primary)] font-medium">
            رزرو جدید: آرایشگاه ← سرویس ← تاریخ ← تأیید هویت ← پرداخت
          </p>
        </div>
      </div>
    </div>
  );
};
