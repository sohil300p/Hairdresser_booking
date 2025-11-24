import React from 'react';
import type { BarberContextType } from '../types';

interface ChatPageProps {
  context: BarberContextType;
}

export const ChatPage: React.FC<ChatPageProps> = ({ context }) => {
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">چت</h1>
      <p className="text-gray-600">صفحه چت در حال توسعه است</p>
    </div>
  );
};

