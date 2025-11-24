import React from 'react';
import type { UserContextType } from '../types';
import { Icon } from '../../shared/components/Icon';

export const NotificationsPage: React.FC<{ context: UserContextType }> = ({ context }) => {
  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
        <button onClick={() => context.setCurrentPage('home')} className="absolute right-0">
          <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">اعلان‌ها</h1>
      </header>

      <div className="px-4">
        {context.notifications.length === 0 && <p className="text-center text-gray-500 mt-12">هیچ اعلانی وجود ندارد.</p>}
        {context.notifications.map(notif => (
          <div 
            key={notif.id} 
            onClick={() => context.markNotificationAsRead(notif.id)}
            className={`bg-white p-4 rounded-lg border border-gray-200 mb-3 text-right cursor-pointer transition-all ${!notif.isRead ? 'border-r-4 border-r-[var(--md-sys-color-primary)]' : 'border-transparent opacity-70'}`}
          >
             <h3 className={`font-bold ${!notif.isRead ? 'text-[var(--md-sys-color-on-surface)]' : 'text-gray-600'}`}>{notif.title}</h3>
             <p className="text-gray-700 my-1">{notif.message}</p>
             <p className="text-xs text-gray-400">{notif.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};