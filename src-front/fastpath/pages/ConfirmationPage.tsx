import React from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';

export const ConfirmationPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="bg-white w-full max-w-sm p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[var(--md-sys-color-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">
          رزرو با موفقیت ثبت شد!
        </h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6 leading-relaxed">
          جزئیات رزرو و اطلاع‌رسانی از طریق پیامک به شما و آرایشگاه ارسال می‌شود.
        </p>

        {context.pageParams?.appointmentId != null && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-[var(--md-sys-color-primary)] mb-1">شماره رزرو</p>
            <p className="text-2xl font-bold font-mono text-[var(--md-sys-color-primary)]">
              {context.pageParams.appointmentId}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={() => context.setCurrentPage('fastpath-landing')}>
            بازگشت به ابتدا
          </Button>
        </div>
      </div>
    </div>
  );
};
