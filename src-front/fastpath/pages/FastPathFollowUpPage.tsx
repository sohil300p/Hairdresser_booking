import React, { useState } from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { api } from '../utils/api';

interface AppointmentItem {
  id: number;
  barbershopId: number | null;
  serviceId: number | null;
  startTime: number;
  endTime: number;
  status: string;
  locationType: string;
  priceTotal: number | null;
  paidAmount: number | null;
  barber?: { name?: string };
  service?: { name?: string };
  barbershop?: { name?: string };
}

interface ListAppointmentsApiResponse {
  success: boolean;
  message?: string;
  appointments?: AppointmentItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'در انتظار', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'تأیید شده', color: 'bg-green-100 text-green-700' },
  paid: { label: 'پرداخت شده', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'انجام شده', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'لغو شده', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'عدم حضور', color: 'bg-gray-100 text-gray-600' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export const FastPathFollowUpPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  // OTP flow state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Reservations state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const sendOtp = () => {
    const phoneTrim = phone.trim();
    if (!phoneTrim) {
      context.showToast('شماره تلفن را وارد کنید', 'error');
      return;
    }
    setLoading(true);
    api
      .post<{ success: boolean }>('/otp/send', { phone: phoneTrim })
      .then((res) => {
        if (res.success) {
          setOtpSent(true);
          context.showToast('کد تأیید ارسال شد', 'success');
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'خطا در ارسال کد', 'error'))
      .finally(() => setLoading(false));
  };

  const verifyAndFetch = () => {
    if (!otp.trim() || otp.length !== 4) {
      context.showToast('کد ۴ رقمی را وارد کنید', 'error');
      return;
    }
    setLoading(true);
    api
      .post<{ success: boolean; token?: string; user?: { name: string; phone: string } }>('/auth/login/otp', {
        phone: phone.trim(),
        otp: otp.trim(),
      })
      .then((res) => {
        if (res.success && res.token && res.user) {
          context.login(res.user as any, res.token);
          setIsLoggedIn(true);
          context.showToast('ورود موفق', 'success');
          fetchAppointments();
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'کد نادرست است', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchAppointments = () => {
    setLoading(true);
    setFetchError(null);
    api
      .get<ListAppointmentsApiResponse>('/appointments?limit=50')
      .then((res) => {
        if (res.success && res.appointments) {
          setAppointments(res.appointments);
        } else {
          setAppointments([]);
          if (res.appointments?.length === 0) return;
          setFetchError(res.message ?? 'خطا در دریافت رزروها');
        }
      })
      .catch((e) => setFetchError(e?.message ?? 'خطا در دریافت رزروها'))
      .finally(() => setLoading(false));
  };

  const handleResendOtp = () => {
    setOtp('');
    sendOtp();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="flex items-center p-4">
          <button
            type="button"
            onClick={() => context.setCurrentPage('fastpath-landing')}
            className="absolute right-4 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Icon name="chevronRight" className="w-5 h-5 text-[var(--md-sys-color-on-surface)]" />
          </button>
          <h1 className="text-lg font-bold text-center flex-1 text-[var(--md-sys-color-on-surface)]">
            پیگیری رزرو
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* ───── OTP Login (not logged in yet) ───── */}
        {!isLoggedIn && (
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            {/* Header icon + text */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
                <Icon name="phone" className="w-8 h-8 text-[var(--md-sys-color-tertiary)]" />
              </div>
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">
                {!otpSent ? 'ورود با شماره تلفن' : 'کد تأیید'}
              </h2>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] text-center mt-1 max-w-xs">
                {!otpSent
                  ? 'برای مشاهده رزروهای خود، شماره تلفن خود را وارد کنید'
                  : `کد ۴ رقمی ارسال شده به ${phone} را وارد کنید`}
              </p>
            </div>

            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1.5">شماره تلفن</label>
                    <input
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm text-center font-mono tracking-wider focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      dir="ltr"
                    />
                  </div>
                  <Button onClick={sendOtp} disabled={loading}>
                    {loading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1.5">کد تأیید</label>
                    <input
                      type="text"
                      placeholder="- - - -"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && verifyAndFetch()}
                      className="w-full rounded-xl border border-gray-200 p-3 text-center text-xl font-mono tracking-[0.5em] focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                  <Button onClick={verifyAndFetch} disabled={loading || otp.length < 4}>
                    {loading ? 'در حال بررسی...' : 'تأیید و مشاهده رزروها'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="w-full text-center text-sm text-[var(--md-sys-color-primary)] hover:underline py-2"
                  >
                    ارسال مجدد کد
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ───── Reservations list (logged in) ───── */}
        {isLoggedIn && (
          <>
            {/* User info bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon name="user" className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--md-sys-color-on-surface)] text-sm">
                  {context.user?.name || 'کاربر'}
                </p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono" dir="ltr">{phone}</p>
              </div>
              <button
                type="button"
                onClick={fetchAppointments}
                disabled={loading}
                className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="بروزرسانی"
              >
                <svg className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Loading */}
            {loading && appointments.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-[var(--md-sys-color-primary)] rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {fetchError && (
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <p className="text-sm text-red-600 mb-3">{fetchError}</p>
                <Button variant="secondary" onClick={fetchAppointments} className="!w-auto !px-6 mx-auto">
                  تلاش مجدد
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !fetchError && appointments.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Icon name="calendar" className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-1">رزروی یافت نشد</h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  هنوز هیچ رزروی با این شماره ثبت نشده است
                </p>
              </div>
            )}

            {/* Appointment cards */}
            {appointments.map((apt) => {
              const statusInfo = STATUS_MAP[apt.status] ?? { label: apt.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={apt.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Card header with status */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
                      #{apt.id}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pb-4 space-y-3">
                    {/* Date & time */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Icon name="calendar" className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">تاریخ و ساعت</p>
                        <p className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">
                          {formatTimestamp(apt.startTime)} — {formatTime(apt.startTime)}
                        </p>
                      </div>
                    </div>

                    {/* Barbershop */}
                    {apt.barbershop?.name && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon name="home" className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">آرایشگاه</p>
                          <p className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">{apt.barbershop.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Service */}
                    {apt.service?.name && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon name="tag" className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">سرویس</p>
                          <p className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">{apt.service.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {apt.priceTotal != null && apt.priceTotal > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon name="wallet" className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">مبلغ</p>
                          <p className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">
                            {apt.priceTotal.toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer - new reservation CTA when viewing list */}
      {isLoggedIn && appointments.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <Button onClick={() => context.setCurrentPage('fastpath-reserve')}>
            رزرو جدید
          </Button>
        </div>
      )}
    </div>
  );
};
