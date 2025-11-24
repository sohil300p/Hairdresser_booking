import React from 'react';
import type { BarberContextType } from '../types';

interface ReviewsPageProps {
  context: BarberContextType;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">نظرات مشتریان</h1>
      <p className="text-gray-600">صفحه نظرات در حال توسعه است</p>
    </div>
  );
};

