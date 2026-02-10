import React, { useState } from 'react';
import type { AppContextType, ReservationLookupResult } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { api } from '../utils/api';

export const FastPathFollowUpPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  const [phone, setPhone] = useState('');
  const [reservationRef, setReservationRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReservationLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const handleLookup = () => {
    const phoneTrim = phone.trim();
    const refTrim = reservationRef.trim();
    if (!phoneTrim || !refTrim) {
      context.showToast('شماره تلفن و کد/شناسه رزرو را وارد کنید', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setLookupError(null);
    setUnavailable(false);
    api
      .get<{ success: boolean; data?: ReservationLookupResult }>(
        `/reservations/lookup?phone=${encodeURIComponent(phoneTrim)}&ref=${encodeURIComponent(refTrim)}`
      )
      .then((res) => {
        if (res.success && res.data) {
          setResult(res.data);
        } else {
          setLookupError((res as { message?: string }).message ?? 'رزروی یافت نشد');
        }
      })
      .catch(() => {
        setUnavailable(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <header className="sticky top-0 bg-white z-10 flex items-center p-4 shadow-sm">
        <button type="button" onClick={() => context.setCurrentPage('fastpath-landing')} className="absolute right-4">
          <Icon name="chevronRight" className="w-6 h-6 text-[var(--md-sys-color-on-surface)]" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 text-[var(--md-sys-color-on-surface)]">
          پیگیری رزرو
        </h1>
      </header>
      <div className="p-4 flex-1">
        {unavailable ? (
          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4">
              در حال حاضر امکان پیگیری از این صفحه وجود ندارد.
            </p>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">
              برای پیگیری رزرو با پشتیبانی تماس بگیرید یا از اپ اصلی استفاده کنید.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setUnavailable(false);
                setLookupError(null);
                setResult(null);
              }}
            >
              تلاش مجدد
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-bold mb-1 text-[var(--md-sys-color-on-surface)]">شماره تلفن</label>
                <input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[var(--md-sys-color-on-surface)]">کد / شناسه رزرو</label>
                <input
                  type="text"
                  placeholder="شماره رزرو یا کد پیگیری"
                  value={reservationRef}
                  onChange={(e) => setReservationRef(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleLookup} disabled={loading}>
              {loading ? 'در حال جستجو...' : 'پیگیری رزرو'}
            </Button>
            {lookupError && !result && (
              <p className="mt-4 text-center text-red-600 text-sm">{lookupError}</p>
            )}
            {result && (
              <div className="mt-6 bg-white p-4 rounded-xl border space-y-2">
                <p className="font-bold text-[var(--md-sys-color-on-surface)]">جزئیات رزرو</p>
                <p><strong>وضعیت:</strong> {result.status}</p>
                <p><strong>تاریخ:</strong> {result.date}</p>
                <p><strong>ساعت:</strong> {result.time}</p>
                {result.barbershopName && <p><strong>آرایشگاه:</strong> {result.barbershopName}</p>}
                {result.serviceName && <p><strong>سرویس:</strong> {result.serviceName}</p>}
                <p className="text-sm text-gray-500">شماره رزرو: {result.id}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
