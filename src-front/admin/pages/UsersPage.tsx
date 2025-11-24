import React from 'react';
import type { AdminContextType } from '../types';

interface UsersPageProps {
  context: AdminContextType;
}

export const UsersPage: React.FC<UsersPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">مدیریت کاربران</h1>
      <p className="text-gray-600">لیست کاربران</p>
    </div>
  );
};

