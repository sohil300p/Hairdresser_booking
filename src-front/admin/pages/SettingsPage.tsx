import React from 'react';
import type { AdminContextType } from '../types';

interface SettingsPageProps {
  context: AdminContextType;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">تنظیمات</h1>
      <p className="text-gray-600">تنظیمات سیستم</p>
    </div>
  );
};

