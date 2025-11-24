import React from 'react';
import type { BarberContextType } from '../types';

interface SupportPageProps {
  context: BarberContextType;
}

export const SupportPage: React.FC<SupportPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">پشتیبانی</h1>
      <p className="text-gray-600">صفحه پشتیبانی در حال توسعه است</p>
    </div>
  );
};

