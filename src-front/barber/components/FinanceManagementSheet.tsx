import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface BarberFinancialConfig {
  platformCommissionPercent: number;
  barberPercent: number;
  exampleAmount: number;
  examplePlatformShare: number;
  exampleBarberShare: number;
  cancellationPolicy: 'not_accepted' | 'tiered';
  cancellationTiers: { minHoursBefore: number; feePercent: number }[];
  hasDeclaredCancellation: boolean;
}

interface FinanceManagementSheetProps {
  isOpen: boolean;
  onOpenBookingSettings: () => void;
}

const TIER_LABELS: Record<number, string> = {
  24: 'یک روز یا بیشتر قبل',
  12: '۱۲ ساعت قبل',
  1: '۱ ساعت قبل',
  0: 'کمتر از ۱ ساعت',
};

export default function FinanceManagementSheet({
  isOpen,
  onOpenBookingSettings,
}: FinanceManagementSheetProps) {
  const [config, setConfig] = useState<BarberFinancialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    api
      .get<{ success: boolean; data?: BarberFinancialConfig; message?: string }>('/barber/financial-config')
      .then((res) => {
        if (res.success && res.data) setConfig(res.data);
        else setError(res.message || 'خطا در دریافت');
      })
      .catch(() => setError('خطا در برقراری ارتباط'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-error-600">{error}</div>
        ) : config ? (
          <>
            <section className="bg-white rounded-xl border shadow-xs p-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-primary-600" />
                نحوه محاسبه سهم‌ها
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">کمیسیون پلتفرم</span>
                  <span className="font-semibold">{config.platformCommissionPercent}٪</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">سهم شما</span>
                  <span className="font-semibold text-success-600">{config.barberPercent}٪</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">مثال برای مبلغ {config.exampleAmount.toLocaleString('fa-IR')} تومان:</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span>سهم پلتفرم</span>
                    <span>{config.examplePlatformShare.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex justify-between font-semibold text-success-700">
                    <span>سهم شما</span>
                    <span>{config.exampleBarberShare.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  درصد کمیسیون پلتفرم بسته به پکیج آرایشگاه متفاوت است
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl border shadow-xs p-4">
              <h2 className="font-bold text-gray-900 mb-4">قوانین لغو</h2>
              <p className="text-sm text-gray-700 mb-3">
                قوانین لغو رزرو توسط شما تعریف می‌شود.
              </p>
              <p className="text-sm text-success-700 text-center bg-success-50 border border-success-200 rounded-lg p-3 mb-3">
                در صورت لغو رزرو توسط آرایشگر، تمام مبلغ به مشتری برمیگردد.
              </p>
              {config.hasDeclaredCancellation ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">کسر وجه بسته به زمان لغو:</p>
                  {config.cancellationTiers
                    .sort((a, b) => b.minHoursBefore - a.minHoursBefore)
                    .map((t) => (
                      <div key={t.minHoursBefore} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span>{TIER_LABELS[t.minHoursBefore] ?? `${t.minHoursBefore} ساعت قبل`}</span>
                        <span>{t.feePercent}٪ کسر</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={onOpenBookingSettings}
                      className="w-full mt-3 py-2 text-sm font-semibold text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                    >
                      ویرایش قوانین لغو
                    </button>
                </div>
              ) : (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={24} className="text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning-800">قوانین لغو تعریف نشده</p>
                    <p className="text-sm text-warning-700 mt-1">
                      برای پذیرش رزرو، باید قوانین لغو را در تنظیمات رزرو تعریف کنید.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenBookingSettings}
                      className="mt-3 py-2 px-4 bg-warning-600 text-white text-sm font-semibold rounded-lg hover:bg-warning-700"
                    >
                      تعریف قوانین لغو
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}
    </div>
  );
}
