import React from 'react';
import type { BarberContextType } from '../types';

interface NotificationsPageProps {
  context: BarberContextType;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">اعلانات</h1>
      <p className="text-gray-600">صفحه اعلانات در حال توسعه است</p>
    </div>
  );
};

