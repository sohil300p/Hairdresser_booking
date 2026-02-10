import React from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';

export const ConfirmationPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6" dir="rtl">
      <h1 className="text-xl font-bold text-center text-[var(--md-sys-color-on-surface)] mb-2">
        رزرو با موفقیت ثبت شد
      </h1>
      <p className="text-sm text-center text-[var(--md-sys-color-on-surface-variant)] mb-8">
        جزئیات رزرو و اطلاع‌رسانی به شما و آرایشگاه ارسال می‌شود.
      </p>
      {context.pageParams?.appointmentId != null && (
        <p className="text-sm text-center text-[var(--md-sys-color-on-surface-variant)] mb-8 font-mono">
          شماره رزرو: {context.pageParams.appointmentId}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button onClick={() => context.setCurrentPage('fastpath-landing')}>
          بازگشت به ابتدا
        </Button>
      </div>
    </div>
  );
};
