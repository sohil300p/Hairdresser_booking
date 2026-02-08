

import React, { useState, useEffect, useCallback } from 'react';
import { List, Calendar, Plus, Check, X } from 'lucide-react';
import type { Screen } from '../App';
import { api } from '../utils/api';
import type { GetAppointmentsResponse, AppointmentItem } from '../types/api';

interface Reservation {
    id: number;
    name: string;
    service: string;
    time: string;
    avatar: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    date: string;
}

function timestampToTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timestampToDateFa(ts: number): string {
  return new Date(ts).toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
}

function mapAppointmentToReservation(appt: AppointmentItem): Reservation {
  const status = appt.status === 'cancelled' || appt.status === 'no_show' ? 'cancelled' as const
    : appt.status === 'pending' ? 'pending' as const
    : 'confirmed' as const;
  return {
    id: appt.id,
    name: appt.customerName || 'مشتری',
    service: appt.serviceName || '-',
    time: timestampToTime(appt.startTime),
    avatar: appt.customerAvatar || 'https://picsum.photos/id/0/100/100',
    status,
    date: timestampToDateFa(appt.startTime),
  };
}

interface ReservationsScreenProps {
    setActiveScreen: (screen: Screen) => void;
    isAutoConfirmEnabled: boolean;
}

const ReservationsScreen: React.FC<ReservationsScreenProps> = ({ setActiveScreen, isAutoConfirmEnabled }) => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReservations = useCallback(async () => {
        try {
            const status = activeFilter === 'all' ? 'all' : activeFilter;
            const res = await api.get<GetAppointmentsResponse>(`/barber/appointments?status=${status}&page=1&limit=100`);
            if (res.success && res.data) {
                setReservations(res.data.appointments.map(mapAppointmentToReservation));
            }
        } catch {
            setReservations([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        setIsLoading(true);
        fetchReservations();
    }, [fetchReservations]);

    useEffect(() => {
        if (isAutoConfirmEnabled && reservations.some(r => r.status === 'pending')) {
            window.showToast("رزروهای در انتظار به صورت خودکار تایید شدند.", "info");
        }
    }, [isAutoConfirmEnabled]);

    const handleReservationAction = async (id: number, action: 'confirm' | 'reject') => {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
        try {
            await api.put(`/barber/appointments/${id}/status`, { status: newStatus });
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            window.showToast(action === 'confirm' ? `رزرو ${reservation.name} تایید شد.` : `رزرو ${reservation.name} رد شد.`, action === 'confirm' ? 'success' : 'info');
        } catch {
            window.showToast('خطا در بروزرسانی وضعیت رزرو', 'error');
        }
    };

    const filteredReservations = reservations.filter(r => {
        if (activeFilter === 'all') return r.status !== 'cancelled';
        return r.status === activeFilter;
    });

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 bg-surface-1 p-4 border-b border-gray-200 z-20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">رزروها</h1>
            <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                <button type="button" onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`} aria-label="نمایش لیست">
                    <List size={18} />
                </button>
                <button type="button" onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`} aria-label="نمایش تقویم">
                    <Calendar size={18} />
                </button>
            </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <FilterButton text="همه" filter="all" active={activeFilter} onClick={setActiveFilter} />
            <FilterButton text="در انتظار" filter="pending" active={activeFilter} onClick={setActiveFilter} />
            <FilterButton text="تایید شده" filter="confirmed" active={activeFilter} onClick={setActiveFilter} />
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4">
        {isLoading ? (
            <div className="text-center py-16 text-gray-600">در حال بارگذاری...</div>
        ) : viewMode === 'list' ? (
            <ListView reservations={filteredReservations} onAction={handleReservationAction} />
        ) : (
            <CalendarView reservations={reservations.filter(r => r.status !== 'cancelled')} onAction={handleReservationAction} />
        )}
      </main>
      <button 
        type="button"
        onClick={() => setActiveScreen('addReservation')}
        className="fixed mr-5 bg-primary-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 hover:shadow-primary-lg hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out z-30" 
        style={{bottom: 'calc(5rem + env(safe-area-inset-bottom))'}} 
        aria-label="افزودن رزرو جدید"
      >
        <Plus size={28} />
      </button>

    </div>
  );
};

type Filter = 'all' | 'pending' | 'confirmed';
const FilterButton: React.FC<{text: string; filter: Filter; active: Filter; onClick: (f: Filter) => void}> = ({text, filter, active, onClick}) => (
    <button type="button" onClick={() => onClick(filter)} className={`px-4 py-2 text-sm font-semibold rounded-full transition whitespace-nowrap ${active === filter ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border text-gray-700'}`}>
        {text}
    </button>
)

const ListView: React.FC<{reservations: Reservation[], onAction: (id: number, action: 'confirm' | 'reject') => void}> = ({ reservations, onAction }) => (
    <div className="space-y-3 pb-20">
        {reservations.map(res => <ReservationCard key={res.id} {...res} onAction={onAction} />)}
        {reservations.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center">
                <Calendar size={48} className="text-gray-300 mb-4" />
                <p className="font-bold text-lg text-gray-700">هیچ رزروی یافت نشد</p>
                <p className="text-gray-600 mt-1">در این دسته‌بندی رزروی برای نمایش وجود ندارد.</p>
            </div>
        )}
    </div>
)

const CalendarView: React.FC<{reservations: Reservation[], onAction: (id: number, action: 'confirm' | 'reject') => void}> = ({ reservations, onAction }) => {
    const today = new Date();
    const todayFa = today.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3');
    
    const [selectedDate, setSelectedDate] = useState<string | null>(todayFa);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const bookingsByDay = reservations.reduce((acc, curr) => {
        const day = parseInt(curr.date.split('/')[2]);
        if (!acc[day]) acc[day] = [];
        acc[day].push(curr);
        return acc;
    }, {} as {[key: number]: Reservation[]});

    const selectedDayNumber = selectedDate ? parseInt(selectedDate.split('/')[2], 10) : null;
    const reservationsForSelectedDay = selectedDayNumber ? bookingsByDay[selectedDayNumber] || [] : [];

    return (
        <div className="space-y-4 pb-20">
            <div className="bg-white p-4 rounded-lg border shadow-xs">
                <div className="text-center font-bold mb-4">مرداد ۱۴۰۳</div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d} className="font-semibold text-gray-600 h-8 flex items-center justify-center">{d}</div>)}
                    {/* Empty cells for start of month */}
                    <div className="col-span-5"></div>
                    {days.map(day => {
                        const dayString = `1403/05/${String(day).padStart(2, '0')}`;
                        const dayBookings = bookingsByDay[day] || [];
                        const hasBookings = dayBookings.length > 0;
                        const hasPending = hasBookings && dayBookings.some(r => r.status === 'pending');
                        const isSelected = selectedDate === dayString;
                        const dayNumber = new Date(dayString.replace(/(\d+)\/(\d+)\/(\d+)/, '2024-07-$3'));
                        const ariaLabelDate = !isNaN(dayNumber.getTime()) ? dayNumber.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }) : `روز ${day}`;
                        const bookingStatus = hasBookings ? `, ${dayBookings.length} رزرو` : ', بدون رزرو';

                        return (
                            <button 
                                key={day}
                                type="button"
                                onClick={() => setSelectedDate(dayString)}
                                aria-label={`${ariaLabelDate}${bookingStatus}`}
                                className={`relative w-9 h-9 rounded-full transition-colors duration-200 flex items-center justify-center mx-auto
                                    ${isSelected ? 'bg-primary-600 text-white font-bold' : hasBookings ? 'bg-primary-100' : 'hover:bg-gray-100'}
                                `}>
                                <span>{day}</span>
                                {hasPending && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 bg-warning-500 rounded-full ring-2 ring-white`}></span>}
                            </button>
                        );
                    })}
                </div>
            </div>
            {selectedDate && (
                <div className="animate-slide-up">
                    <h3 className="font-bold mb-2">
                        رزروهای {new Date(selectedDate.replace(/(\d+)\/(\d+)\/(\d+)/, '2024-07-$3')).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <div className="space-y-3">
                        {reservationsForSelectedDay.length > 0 ? (
                            reservationsForSelectedDay.map(res => <ReservationCard key={res.id} {...res} onAction={onAction} />)
                        ) : (
                            <p className="text-center text-gray-600 pt-4">هیچ رزروی برای این روز ثبت نشده است.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const ReservationCard: React.FC<Reservation & { onAction: (id: number, action: 'confirm' | 'reject') => void }> = ({ id, name, service, time, avatar, status, date, onAction }) => {
    return (
        <div className="bg-white p-4 rounded-lg border shadow-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-bold">{name}</p>
                        <p className="text-sm text-gray-700">{service}</p>
                    </div>
                </div>
                 <div className="text-left">
                     <p className="font-semibold">{time}</p>
                     <p className="text-xs text-gray-600">{date}</p>
                </div>
            </div>
            {status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button type="button" onClick={() => onAction(id, 'confirm')} className="flex-1 bg-success-500 text-white py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-1 transition hover:bg-success-600">
                        <Check size={16} /> تایید
                    </button>
                    <button type="button" onClick={() => onAction(id, 'reject')} className="flex-1 bg-error-500 text-white py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-1 transition hover:bg-error-600">
                        <X size={16} /> رد
                    </button>
                </div>
            )}
        </div>
    )
}

export default ReservationsScreen;