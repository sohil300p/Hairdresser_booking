import React from 'react';
import type { AdminContextType } from '../types';

interface BarbersPageProps {
  context: AdminContextType;
}

export const BarbersPage: React.FC<BarbersPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">مدیریت آرایشگران</h1>
      <p className="text-gray-600">لیست آرایشگران</p>
    </div>
  );
};

