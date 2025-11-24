import React, { useState } from 'react';
import { ArrowRight, Edit, Clock, Tag, LogOut, Settings } from 'lucide-react';
import type { BarberContextType } from '../types';

interface ProfilePageProps {
  context: BarberContextType;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ context }) => {
  const handleLogout = async () => {
    await context.logout();
  };

  return (
    <div className="flex flex-col h-full bg-surface-1">
      <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
        <h1 className="text-2xl font-bold">پروفایل</h1>
      </header>
      <main className="flex-grow p-4 space-y-4 overflow-y-auto">
        <div className="bg-white p-4 rounded-lg border shadow-xs">
          <div className="flex items-center gap-4">
            <img src={context.user?.avatarUrl || "https://picsum.photos/id/1027/100/100"} alt="آواتار" className="w-20 h-20 rounded-full border-4 border-primary-100" />
            <div>
              <h2 className="text-xl font-bold">{context.user?.name || 'سالن زیبایی شما'}</h2>
              <p className="text-gray-600" dir="ltr">{context.user?.phone || ''}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => context.setCurrentPage('services')} className="w-full text-right flex items-center justify-between p-4 bg-white rounded-lg border shadow-xs hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">خدمات و قیمت‌گذاری</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => context.setCurrentPage('schedule')} className="w-full text-right flex items-center justify-between p-4 bg-white rounded-lg border shadow-xs hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">ساعات کاری</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => context.setCurrentPage('earnings')} className="w-full text-right flex items-center justify-between p-4 bg-white rounded-lg border shadow-xs hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">تنظیمات</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <button onClick={handleLogout} className="w-full text-right flex items-center justify-between p-4 bg-error-50 text-error-600 rounded-lg border border-error-200 hover:bg-error-100 transition mt-4">
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">خروج</span>
          </div>
        </button>
      </main>
    </div>
  );
};
