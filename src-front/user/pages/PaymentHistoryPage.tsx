import React from 'react';
import type { UserContextType } from '../types';
import { TRANSACTIONS } from '../constants';
import { Icon } from '../../shared/components/Icon';

interface PaymentHistoryPageProps {
  context: UserContextType;
}

export const PaymentHistoryPage: React.FC<PaymentHistoryPageProps> = ({ context }) => {
  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
        <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
          <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">تاریخچه پرداخت‌ها</h1>
      </header>

      <div className="px-4">
        {TRANSACTIONS.map(tx => (
          <div key={tx.id} className="bg-white p-4 rounded-lg border border-gray-200 mb-3 text-right">
             <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{tx.booking.service.name}</p>
                  <p className="text-sm text-gray-500">{tx.booking.barber.name}</p>
                </div>
                <p className="font-bold font-mono text-lg">{Number(tx.amount).toLocaleString('en-US')} <span className="text-sm font-sans">تومان</span></p>
             </div>
             <div className="border-t my-3"></div>
             <div className="flex justify-between text-sm text-gray-500">
                <span className="font-mono">{tx.date}</span>
                <span className={`font-semibold ${tx.status === 'موفق' ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-error)]'}`}>
                    {tx.status}
                </span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};