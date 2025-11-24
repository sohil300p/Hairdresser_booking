import React from 'react';
import type { AdminContextType } from '../types';

interface DashboardPageProps {
  context: AdminContextType;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">داشبورد مدیریت</h1>
      <p className="text-gray-600">به پنل مدیریت سیستم خوش آمدید</p>
    </div>
  );
};

