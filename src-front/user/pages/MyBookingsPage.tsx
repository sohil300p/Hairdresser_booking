import React, { useState } from 'react';
import type { UserContextType } from '../types';
import type { Booking } from '../../shared/types/common';
import { BookingStatus } from '../../shared/types/common';
import { Button } from '../../shared/components/Button';

export const MyBookingsPage: React.FC<{ context: UserContextType }> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');

  const upcomingBookings = context.bookings.filter(b => b.status === BookingStatus.Confirmed);
  const pastBookings = context.bookings.filter(b => b.status === BookingStatus.Completed);
  const canceledBookings = context.bookings.filter(b => b.status === BookingStatus.Canceled);

  const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
     const statusColors = {
        [BookingStatus.Confirmed]: 'bg-blue-100 text-blue-800',
        [BookingStatus.Completed]: 'bg-green-100 text-green-800',
        [BookingStatus.Canceled]: 'bg-red-100 text-red-800',
     };

     const handleCancel = () => {
        context.showModal(
            <div className="text-right p-2">
                <h3 className="text-xl font-bold mb-4 text-center">لغو رزرو</h3>
                <p className="text-gray-600 mb-2 text-center">آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟</p>
                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-3 my-4 text-right">
                    <p className="text-sm text-yellow-800 font-bold mb-1">
                        سیاست استرداد وجه:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                        <li>لغو <b>بیش از ۳ ساعت</b> قبل از زمان رزرو: <b>بازپرداخت ۱۰۰٪</b></li>
                        <li>لغو <b>۳ ساعت یا کمتر</b> قبل از زمان رزرو: <b>جریمه ۲۵٪</b></li>
                    </ul>
                </div>
                <div className="flex gap-3 mt-6">
                    <Button variant="secondary" onClick={context.hideModal}>
                        بازگشت
                    </Button>
                    <Button 
                        variant="danger"
                        onClick={() => {
                            context.cancelBooking(booking.id);
                            context.hideModal();
                        }}
                    >
                        بله، لغو کن
                    </Button>
                </div>
            </div>,
            'bottom'
        );
     };

     return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 text-right">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <img src={booking.barber.avatarUrl} alt={booking.barber.name} className="w-16 h-16 rounded-lg ml-4 object-cover" />
                    <div>
                        <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">{booking.barber.name}</h3>
                        <p className="text-gray-600">{booking.service.name}</p>
                    </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                    {booking.status}
                </span>
            </div>
            <div className="border-t my-3"></div>
            <div className="flex justify-between text-gray-700">
                <div>
                    <p>تاریخ: <span className="font-semibold font-mono">{booking.date}</span></p>
                    <p>ساعت: <span className="font-semibold font-mono">{booking.time}</span></p>
                </div>
                <p className="font-bold text-lg">{Number(booking.price).toLocaleString('en-US')} <span className="text-sm font-sans">تومان</span></p>
            </div>
             <div className="mt-4 flex gap-2">
                 {booking.status === BookingStatus.Confirmed && (
                    <>
                        <Button onClick={handleCancel} variant="danger-ghost" className="flex-1 py-2 text-sm">لغو رزرو</Button>
                        <Button onClick={() => context.rebook(booking)} variant="secondary" className="flex-1 py-2 text-sm">تغییر زمان</Button>
                    </>
                 )}
                 {(booking.status === BookingStatus.Completed || booking.status === BookingStatus.Canceled) && (
                    <Button onClick={() => context.rebook(booking)} variant="primary" className="flex-1 py-2 text-sm">رزرو مجدد</Button>
                 )}
            </div>
        </div>
     )
  }

  const TabButton: React.FC<{ tab: 'upcoming' | 'past' | 'canceled', label: string, count: number }> = ({ tab, label, count }) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`w-1/3 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)]' : 'text-gray-500'}`}
      >
        {label} ({count})
      </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
            <h1 className="text-2xl font-bold text-center text-[var(--md-sys-color-on-surface)]">رزروهای من</h1>
        </header>

        <div className="sticky top-16 z-10 border-b border-gray-200 bg-white">
            <nav className="flex justify-around">
                <TabButton tab="upcoming" label="آینده" count={upcomingBookings.length} />
                <TabButton tab="past" label="گذشته" count={pastBookings.length} />
                <TabButton tab="canceled" label="لغو شده" count={canceledBookings.length} />
            </nav>
        </div>

        <div className="p-4">
            {activeTab === 'upcoming' && (
                upcomingBookings.length > 0 
                    ? upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />) 
                    : <p className="text-center text-gray-500 mt-12">رزرو فعالی ندارید.</p>
            )}
            {activeTab === 'past' && (
                pastBookings.length > 0 
                    ? pastBookings.map(b => <BookingCard key={b.id} booking={b} />) 
                    : <p className="text-center text-gray-500 mt-12">رزرو گذشته‌ای ندارید.</p>
            )}
            {activeTab === 'canceled' && (
                canceledBookings.length > 0
                    ? canceledBookings.map(b => <BookingCard key={b.id} booking={b} />)
                    : <p className="text-center text-gray-500 mt-12">رزرو لغو شده‌ای ندارید.</p>
            )}
        </div>
    </div>
  );
};