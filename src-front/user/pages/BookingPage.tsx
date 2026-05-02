import React, { useState, useMemo } from 'react';
import type { AppContextType, Barber, Service } from '../types';
import { Icon, IconName } from '../components/Icon';
import { Button } from '../components/Button';
import { Calendar } from '../components/Calendar';
import { TIME_SLOTS } from '../constants';

// --- Google Calendar & ICS Utilities ---
// NOTE: In a real production app, this Client ID would come from a secure environment variable.
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

interface BookingData {
    barber: Barber;
    service: Service;
    date: Date;
    time: string;
    notes: string;
    id: string;
}

const gapiLoadPromise = new Promise<void>((resolve, reject) => {
    // FIX: Cast the result of querySelector to HTMLScriptElement to access onload/onerror.
    const script = document.querySelector<HTMLScriptElement>('script[src="https://apis.google.com/js/api.js"]');
    if (!script) {
        reject(new Error('Google API script not found.'));
        return;
    }
    script.onload = () => {
        (window as any).gapi.load('client:auth2', resolve);
    };
    script.onerror = reject;
});

const initializeGapiClient = async (): Promise<void> => {
    await gapiLoadPromise;
    await (window as any).gapi.client.init({
        clientId: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    });
};

const handleAddToGoogleCalendar = async (bookingData: BookingData, showToast: AppContextType['showToast']) => {
    try {
        await initializeGapiClient();
        const gapi = (window as any).gapi;
        
        let authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
            await authInstance.signIn();
        }

        const [hours, minutes] = bookingData.time.split(':').map(Number);
        const startDate = new Date(bookingData.date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + bookingData.service.duration * 60000);

        const event = {
            summary: `Barber: ${bookingData.barber.name} - ${bookingData.service.name}`,
            location: `${bookingData.barber.name}`,
            description: `Service: ${bookingData.service.name}\nNotes: ${bookingData.notes || 'None'}\nBooking ID: ${bookingData.id}`,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', 'minutes': 60 }],
            },
        };

        const request = gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        await request;
        showToast('رزرو به تقویم گوگل شما اضافه شد!', 'success');
    } catch (error: any) {
        console.error('Error adding to Google Calendar:', error);
        if (error.type === 'popup_closed_by_user' || error.error === 'access_denied') {
             showToast('امکان افزودن وجود ندارد. فایل ICS دانلود می‌شود.', 'error');
        } else {
             showToast('خطا در افزودن به تقویم. فایل ICS دانلود می‌شود.', 'error');
        }
        handleDownloadIcs(bookingData);
    }
};

const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

const handleDownloadIcs = (bookingData: BookingData) => {
    const [hours, minutes] = bookingData.time.split(':').map(Number);
    const startDate = new Date(bookingData.date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + bookingData.service.duration * 60000);

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LocalBarber//EN',
        'BEGIN:VEVENT',
        `UID:${bookingData.id}@localbarber.app`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `SUMMARY:Barber: ${bookingData.barber.name} - ${bookingData.service.name}`,
        `DESCRIPTION:Service: ${bookingData.service.name}\\nNotes: ${bookingData.notes || 'None'}\\nBooking ID: ${bookingData.id}`,
        `LOCATION:${bookingData.barber.name}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'booking.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


const BookingSuccessModalContent: React.FC<{
    bookingId: string;
    bookingData: BookingData;
    context: AppContextType;
}> = ({ bookingId, bookingData, context }) => {
    
    const onAddToCalendar = () => {
         context.showToast('در حال اتصال به تقویم گوگل...', 'success');
         handleAddToGoogleCalendar(bookingData, context.showToast);
    };
    
    return (
        <div className="text-center p-2">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--md-sys-color-tertiary)] mb-4">
                 <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                 </svg>
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">رزرو با موفقیت انجام شد!</h3>
            <p className="text-sm text-gray-500 mt-2 px-4">
                رزرو شما ثبت شد. برای جلوگیری از فراموشی، آن را به تقویم گوگل خود اضافه کنید.
            </p>
            <div className="mt-6 space-y-2">
                <Button onClick={onAddToCalendar}>افزودن به تقویم گوگل</Button>
                <Button variant="secondary" onClick={() => {
                    context.hideModal();
                    context.setCurrentPage('my-bookings');
                }}>
                    مشاهده رزروهای من
                </Button>
            </div>
        </div>
    );
};


export const BookingPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { selectedBarber: barber, selectedService: service, user } = context;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const finalPrice = useMemo(() => {
      return service?.price || 0;
  }, [service]);

  if (!barber || !service || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <p>اطلاعات رزرو ناقص است. لطفا دوباره تلاش کنید.</p>
        <Button className="mt-4" onClick={() => context.setCurrentPage('home')}>بازگشت به خانه</Button>
      </div>
    );
  }
  
  const isWalletDisabled = user.walletBalance < finalPrice;

  const handleConfirmBooking = () => {
    if (!selectedTime) {
      context.showToast('لطفا یک زمان را انتخاب کنید.', 'error');
      return;
    }
    
    context.showModal(
        <div className="text-right p-2">
            <h3 className="text-xl font-bold mb-4 text-center">تایید نهایی رزرو</h3>
            <div className="space-y-2 text-gray-700">
                <p><strong>آرایشگاه:</strong> {barber.name}</p>
                <p><strong>سرویس:</strong> {service.name}</p>
                <p><strong>تاریخ:</strong> <span className="font-mono">{selectedDate.toLocaleDateString('fa-IR-u-nu-latn')}</span></p>
                <p><strong>ساعت:</strong> <span className="font-mono">{selectedTime}</span></p>
                <p><strong>مبلغ نهایی:</strong> <span className="font-mono">{finalPrice.toLocaleString('en-US')} تومان</span></p>
            </div>
            <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={context.hideModal}>بازبینی</Button>
                <Button onClick={finalizeBooking} disabled={isWalletDisabled}>تایید و پرداخت</Button>
            </div>
        </div>,
        'bottom'
    );
  }

  const finalizeBooking = () => {
     const newBookingId = context.addBooking({
      barber,
      service,
      date: selectedDate.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: selectedTime!,
      price: finalPrice,
    }, 'wallet');
    
    context.hideModal();

    const bookingDataForCalendar: BookingData = {
        barber,
        service,
        date: selectedDate, // Pass the JS Date object
        time: selectedTime!,
        notes,
        id: newBookingId,
    };

    setTimeout(() => {
        context.showModal(
          <BookingSuccessModalContent 
              bookingId={newBookingId}
              bookingData={bookingDataForCalendar}
              context={context}
          />,
          'bottom'
        );
    }, 300); // Short delay to allow first modal to close
  }
  
  const PaymentOption: React.FC<{ 
    icon: IconName;
    label: string;
    details?: string;
    disabled?: boolean;
  }> = ({ icon, label, details, disabled }) => (
    <div
        className={`w-full flex items-center text-right p-3 rounded-lg border-2 transition-all border-[var(--md-sys-color-primary)] bg-blue-50 ${disabled ? 'opacity-50' : ''}`}
    >
        <Icon name={icon} className="w-6 h-6 text-[var(--md-sys-color-primary)] ml-3"/>
        <div>
            <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{label}</p>
            {details && <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{details}</p>}
        </div>
        <div className="mr-auto w-5 h-5 flex items-center justify-center border-2 rounded-full border-[var(--md-sys-color-primary)]">
            <div className="w-2.5 h-2.5 bg-[var(--md-sys-color-primary)] rounded-full"></div>
        </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col" dir="rtl">
       <header className="sticky top-0 bg-white z-10 flex items-center p-4 shadow-sm">
        <button onClick={() => context.setCurrentPage('barber', { barber })} className="absolute right-4">
          <Icon name="chevronRight" className="w-6 h-6 text-[var(--md-sys-color-on-surface)]" />
        </button>
        <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">رزرو وقت</h1>
      </header>

      <div className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center">
            <img src={barber.avatarUrl} alt={barber.name} className="w-16 h-16 rounded-lg ml-4 object-cover" />
            <div className="text-right">
                <h2 className="font-bold text-lg">{barber.name}</h2>
                <p className="text-sm text-gray-600">{service.name}</p>
            </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h2 className="font-bold text-lg text-right mb-4">انتخاب تاریخ</h2>
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h2 className="font-bold text-lg text-right mb-4">انتخاب ساعت</h2>
             <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(time => (
                    <button 
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 rounded-lg text-center font-mono transition-all transform active:scale-95 text-sm min-h-[44px] flex items-center justify-center ${selectedTime === time ? 'bg-[var(--md-sys-color-primary)] text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                        {time}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h2 className="font-bold text-lg text-right mb-2">یادداشت <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]"></span></h2>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات خاصی برای آرایشگر دارید؟"
                className="form-textarea"
                rows={3}
            />
             <p className="text-xs text-gray-400 mt-2 text-right">مثال: موهای من فر است و به مراقبت ویژه نیاز دارد.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-right mb-3 text-lg">روش پرداخت</h3>
            <div className="space-y-2">
                <PaymentOption 
                    icon="wallet"
                    label="کیف پول"
                    details={`موجودی: ${user.walletBalance.toLocaleString('en-US')} تومان`}
                    disabled={isWalletDisabled}
                />
                 {isWalletDisabled && (
                    <div className="text-center text-sm text-[var(--md-sys-color-error)] p-3 bg-red-50 rounded-lg mt-2">
                        موجودی کیف پول شما برای این رزرو کافی نیست. 
                        <button
                            onClick={() => context.setCurrentPage('wallet')}
                            className="font-bold text-[var(--md-sys-color-primary)] mr-1 underline"
                        >
                            شارژ کیف پول
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-right mb-3 text-lg">خلاصه هزینه</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between"><span>{service.name}</span><span className="font-mono">{service.price.toLocaleString('en-US')} تومان</span></div>
              <div className="flex justify-between text-base font-bold text-[var(--md-sys-color-on-surface)] pt-2 border-t mt-2"><span>مبلغ نهایی</span><span className="font-mono">{finalPrice.toLocaleString('en-US')} تومان</span></div>
            </div>
        </div>
      </div>
      
      <div className="mt-auto p-4">
        <Button onClick={handleConfirmBooking} disabled={!selectedTime || isWalletDisabled} sticky={true}>
            تایید و تکمیل رزرو
        </Button>
      </div>
    </div>
  );
};