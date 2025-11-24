import React from 'react';
import type { BarberContextType } from '../types';

interface EarningsPageProps {
  context: BarberContextType;
}

export const EarningsPage: React.FC<EarningsPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">درآمد</h1>
      <p className="text-gray-600">صفحه درآمد در حال توسعه است</p>
    </div>
  );
};
