import React from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';

export const FastPathLandingPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6" dir="rtl">
      <h1 className="text-xl font-bold text-center text-[var(--md-sys-color-on-surface)] mb-2">
        مسیر سریع رزرو
      </h1>
      <p className="text-sm text-center text-[var(--md-sys-color-on-surface-variant)] mb-8">
        یکی از گزینه‌ها را انتخاب کنید
      </p>
      <div className="space-y-4">
        <Button
          className="w-full"
          onClick={() => context.setCurrentPage('fastpath-reserve')}
        >
          رزرو جدید
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => context.setCurrentPage('fastpath-follow-up')}
        >
          پیگیری رزرو
        </Button>
      </div>
    </div>
  );
};
