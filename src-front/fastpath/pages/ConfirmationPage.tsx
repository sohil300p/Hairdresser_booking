import React, { useEffect, useMemo, useState } from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';
import { api } from '../utils/api';

export const ConfirmationPage: React.FC<{ context: AppContextType }> = ({ context }) => {
  const appointmentId = context.pageParams?.appointmentId as number | undefined;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any | null>(null);

  useEffect(() => {
    if (appointmentId == null) return;
    setLoading(true);
    setError(null);
    api
      .get<{ success: boolean; message: string; appointment?: any }>(`/appointments/${appointmentId}`)
      .then((res) => {
        if (res.success && res.appointment) setAppointment(res.appointment);
        else setError(res.message || 'دریافت جزئیات رزرو انجام نشد');
      })
      .catch((e) => setError(e?.message ?? 'دریافت جزئیات رزرو انجام نشد'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const statusText = useMemo(() => {
    const s = (appointment?.status ?? '').toLowerCase();
    if (s === 'paid') return 'پرداخت شده';
    if (s === 'pending') return 'در انتظار پرداخت';
    if (s === 'confirmed') return 'تأیید شده';
    if (s === 'completed') return 'انجام شده';
    if (s === 'cancelled') return 'لغو شده';
    if (s === 'no_show') return 'عدم مراجعه';
    return appointment?.status ? String(appointment.status) : 'ثبت شده';
  }, [appointment?.status]);

  const start = appointment?.startTime ? new Date(Number(appointment.startTime)) : null;
  const dateTimeText = useMemo(() => {
    if (!start) return null;
    const date = start.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = start.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return `${date} — ${time}`;
  }, [start?.getTime()]);

  const priceText = useMemo(() => {
    const amount = appointment?.priceTotal ?? appointment?.paidAmount ?? null;
    if (amount == null) return null;
    try {
      return `${Number(amount).toLocaleString('fa-IR')} تومان`;
    } catch {
      return `${amount} تومان`;
    }
  }, [appointment?.priceTotal, appointment?.paidAmount]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="bg-white w-full max-w-sm p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[var(--md-sys-color-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">
          رزرو با موفقیت ثبت شد!
        </h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6 leading-relaxed">
          {loading ? 'در حال دریافت جزئیات رزرو...' : 'جزئیات رزرو شما در ادامه نمایش داده می‌شود.'}
        </p>

        {appointmentId != null && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-[var(--md-sys-color-primary)] mb-1">پیگیری رزرو</p>
            <p className="text-2xl font-bold font-mono text-[var(--md-sys-color-primary)]">#{appointmentId}</p>
            <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">{statusText}</p>
          </div>
        )}

        {appointment?.publicRef && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 text-right">
            <p className="text-xs text-gray-500 mb-1">کد پیگیری (بدون نیاز به OTP)</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-bold font-mono text-[var(--md-sys-color-primary)]" dir="ltr">{String(appointment.publicRef).toUpperCase()}</p>
              <button
                type="button"
                className="text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                onClick={() => navigator.clipboard.writeText(String(appointment.publicRef).toUpperCase())}
              >
                کپی
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-right">
            <p className="text-sm text-[var(--md-sys-color-error)]">{error}</p>
          </div>
        )}

        {appointment && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 text-right space-y-3">
            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-500">کاربر</span>
              <span className="text-sm font-mono text-gray-900" dir="ltr">{appointment?.customer?.phone ?? context.user?.phone ?? '-'}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-500">تاریخ و ساعت</span>
              <span className="text-sm text-gray-900 font-semibold">{dateTimeText ?? '-'}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-500">آرایشگاه</span>
              <span className="text-sm text-gray-900 font-semibold">{appointment?.barbershop?.name ?? '-'}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-500">سرویس</span>
              <span className="text-sm text-gray-900 font-semibold">{appointment?.service?.name ?? '-'}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-500">مبلغ</span>
              <span className="text-sm text-gray-900 font-semibold">{priceText ?? '-'}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={() => context.setCurrentPage('fastpath-landing')}>
            بازگشت به ابتدا
          </Button>
        </div>
      </div>
    </div>
  );
};
