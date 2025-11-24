import React from 'react';
import type { BarberContextType } from '../types';

interface AddReservationPageProps {
  context: BarberContextType;
}

export const AddReservationPage: React.FC<AddReservationPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">افزودن رزرو</h1>
      <p className="text-gray-600">صفحه افزودن رزرو در حال توسعه است</p>
    </div>
  );
};

