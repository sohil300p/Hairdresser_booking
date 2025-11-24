import React from 'react';
import type { AdminContextType } from '../types';

interface AppointmentsPageProps {
  context: AdminContextType;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">مدیریت رزروها</h1>
      <p className="text-gray-600">لیست تمام رزروها</p>
    </div>
  );
};

