import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, UserPlus, CalendarCheck, XCircle, Gift, Info, LoaderCircle } from 'lucide-react';
import type { Screen } from '../App';
import { api } from '../utils/api';

type NotificationCategory = 'all' | 'unread' | 'read';
type NotificationType = 'new_booking' | 'cancellation' | 'reminder' | 'promotion' | 'system';

interface BarberNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

interface ListResponse {
  success: boolean;
  message?: string;
  data?: {
    notifications: BarberNotification[];
    unreadCount: number;
  };
}

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

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60 * 1000) return 'همین الان';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} دقیقه پیش`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} ساعت پیش`;
  if (diff < 2 * 24 * 60 * 60 * 1000) return 'دیروز';
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} روز پیش`;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

const NotificationsScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({ setActiveScreen }) => {
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<BarberNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async (filter: NotificationCategory) => {
    setLoading(true);
    try {
      const result = await api.get<ListResponse>(`/barber/notifications?filter=${filter}`);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(activeFilter);
  }, [activeFilter, fetchNotifications]);

  const handleMarkRead = async (n: BarberNotification) => {
    if (n.read) return;
    setMarkingId(n.id);
    try {
      await api.patch<{ success: boolean }>(`/barber/notifications/${n.id}/read`);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      window.showToast?.('خطا در به‌روزرسانی', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkAllLoading(true);
    try {
      await api.patch<{ success: boolean }>('/barber/notifications/read-all');
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
      window.showToast?.('همه اعلان‌ها خوانده شد', 'success');
    } catch {
      window.showToast?.('خطا در به‌روزرسانی', 'error');
    } finally {
      setMarkAllLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button type="button" onClick={() => setActiveScreen('home')} aria-label="بازگشت">
            <ArrowRight />
          </button>
          <h1 className="text-2xl font-bold">اعلانات</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton text="همه" filter="all" active={activeFilter} onClick={setActiveFilter} />
          <FilterButton text="خوانده نشده" filter="unread" active={activeFilter} onClick={setActiveFilter} />
          <FilterButton text="خوانده شده" filter="read" active={activeFilter} onClick={setActiveFilter} />
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllLoading}
              className="mr-auto px-3 py-1.5 text-sm text-primary-600 font-medium rounded-full border border-primary-200 hover:bg-primary-50 disabled:opacity-50"
            >
              {markAllLoading ? <LoaderCircle size={16} className="animate-spin inline" /> : 'همه را بخوان'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoaderCircle size={32} className="animate-spin text-primary-600" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkRead(notification)}
              className="w-full text-right bg-white p-4 rounded-lg border shadow-xs flex items-start gap-4 hover:bg-gray-50 transition"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[notification.type]}`}
              >
                {React.createElement(iconMap[notification.type], { size: 20 })}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{notification.title}</p>
                    <p className="text-sm text-gray-700 mt-0.5">{notification.body}</p>
                  </div>
                  {!notification.read && (
                    <span className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                  {markingId === notification.id && (
                    <LoaderCircle size={18} className="animate-spin text-primary-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-600/70 mt-1">{formatTime(notification.createdAt)}</p>
              </div>
            </button>
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

const FilterButton: React.FC<{
  text: string;
  filter: NotificationCategory;
  active: NotificationCategory;
  onClick: (f: NotificationCategory) => void;
}> = ({ text, filter, active, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(filter)}
    className={`px-4 py-2 text-sm font-semibold rounded-full transition ${active === filter ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border text-gray-700'}`}
  >
    {text}
  </button>
);

export default NotificationsScreen;
