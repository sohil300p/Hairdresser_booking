

import React, { useState } from 'react';
import { ArrowRight, UserPlus, CalendarCheck, XCircle, Gift, Info } from 'lucide-react';
// Import the shared Screen type from App.tsx for navigation callbacks.
import type { Screen } from '../App';

type NotificationCategory = 'all' | 'unread' | 'read';
type NotificationType = 'new_booking' | 'cancellation' | 'reminder' | 'promotion' | 'system';

interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

const notifications: Notification[] = [
    { id: 1, type: 'new_booking', title: 'رزرو جدید', description: 'احمد رضایی برای ساعت ۱۴:۳0 نوبت گرفت.', time: '۲ دقیقه پیش', read: false },
    { id: 2, type: 'cancellation', title: 'لغو رزرو', description: 'رزرو حسن محمدی برای فردا لغو شد.', time: '۱ ساعت پیش', read: false },
    { id: 3, type: 'reminder', title: 'یادآوری', description: 'فردا ۳ نوبت رزرو شده دارید.', time: 'دیروز', read: true },
    { id: 4, type: 'promotion', title: 'تخفیف', description: 'کد تخفیف عید قربان فعال شد.', time: '۲ روز پیش', read: true },
    { id: 5, type: 'system', title: 'سیستم', description: 'نسخه جدید اپلیکیشن در دسترس است.', time: 'هفته پیش', read: true },
];

const iconMap: { [key in NotificationType]: React.ElementType } = {
    new_booking: UserPlus,
    cancellation: XCircle,
    reminder: CalendarCheck,
    promotion: Gift,
    system: Info,
};

const colorMap: { [key in NotificationType]: string } = {
    new_booking: 'bg-info-100 text-info-600',
    cancellation: 'bg-error-100 text-error-600',
    reminder: 'bg-primary-100 text-primary-600',
    promotion: 'bg-accent-100 text-accent-700',
    system: 'bg-gray-100 text-gray-600',
};


const NotificationsScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({ setActiveScreen }) => {
    const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');

    const filteredNotifications = notifications.filter(n => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'read') return n.read;
        if (activeFilter === 'unread') return !n.read;
        return false;
    });

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setActiveScreen('home')}><ArrowRight /></button>
                    <h1 className="text-2xl font-bold">اعلانات</h1>
                </div>
                <div className="flex gap-2">
                    <FilterButton text="همه" filter="all" active={activeFilter} onClick={setActiveFilter} />
                    <FilterButton text="خوانده نشده" filter="unread" active={activeFilter} onClick={setActiveFilter} />
                    <FilterButton text="خوانده شده" filter="read" active={activeFilter} onClick={setActiveFilter} />
                </div>
            </header>

            <main className="flex-grow p-4 space-y-3">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notification => (
                        <div key={notification.id} className="bg-white p-4 rounded-lg border shadow-xs flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[notification.type]}`}>
                                {React.createElement(iconMap[notification.type], { size: 20 })}
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{notification.title}</p>
                                        <p className="text-sm text-gray-700">{notification.description}</p>
                                    </div>
                                    {!notification.read && <span className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0 mt-1.5 ml-1"></span>}
                                </div>
                                <p className="text-xs text-gray-600/70 mt-1">{notification.time}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 flex flex-col items-center">
                        <Info size={48} className="text-gray-300 mb-4" />
                        <p className="font-bold text-lg text-gray-700">هیچ اعلانی یافت نشد</p>
                        <p className="text-gray-600 mt-1">در این دسته‌بندی اعلانی برای نمایش وجود ندارد.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

const FilterButton: React.FC<{text: string; filter: NotificationCategory; active: NotificationCategory; onClick: (f: NotificationCategory) => void}> = ({text, filter, active, onClick}) => (
    <button onClick={() => onClick(filter)} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${active === filter ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border text-gray-700'}`}>
        {text}
    </button>
)

export default NotificationsScreen;
