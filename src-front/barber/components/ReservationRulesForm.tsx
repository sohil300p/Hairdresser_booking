import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface CancellationTier {
  minHoursBefore: number;
  feePercent: number;
}

interface ReservationRules {
  reservationPaymentPercent: number;
  cancellationPolicy: 'not_accepted' | 'tiered';
  cancellationTiers: CancellationTier[];
}

interface ReservationRulesFormProps {
  isVisible: boolean;
  onSaved?: () => void;
}

const TIER_LABELS: { minHoursBefore: number; label: string }[] = [
  { minHoursBefore: 24, label: 'یک روز یا بیشتر قبل' },
  { minHoursBefore: 12, label: '۱۲ ساعت قبل' },
  { minHoursBefore: 1, label: '۱ ساعت قبل' },
  { minHoursBefore: 0, label: 'کمتر از ۱ ساعت' },
];

const DEFAULT_TIERS: CancellationTier[] = [
  { minHoursBefore: 24, feePercent: 0 },
  { minHoursBefore: 12, feePercent: 20 },
  { minHoursBefore: 1, feePercent: 50 },
  { minHoursBefore: 0, feePercent: 100 },
];

export default function ReservationRulesForm({ isVisible, onSaved }: ReservationRulesFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reservationPaymentPercent, setReservationPaymentPercent] = useState(100);
  const [cancellationPolicy, setCancellationPolicy] = useState<'not_accepted' | 'tiered'>('tiered');
  const [cancellationTiers, setCancellationTiers] = useState<CancellationTier[]>(DEFAULT_TIERS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const fetchRules = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<{ success: boolean; data?: ReservationRules }>('/barber/reservation-rules');
        if (res.success && res.data) {
          setReservationPaymentPercent(res.data.reservationPaymentPercent ?? 100);
          setCancellationPolicy(res.data.cancellationPolicy ?? 'tiered');
          setCancellationTiers(res.data.cancellationTiers?.length ? res.data.cancellationTiers : DEFAULT_TIERS);
        }
      } catch {
        setError('خطا در دریافت تنظیمات');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRules();
  }, [isVisible]);

  const handleTierChange = (minHoursBefore: number, feePercent: number) => {
    setCancellationTiers((prev) =>
      prev.map((t) => (t.minHoursBefore === minHoursBefore ? { ...t, feePercent } : t))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await api.put('/barber/reservation-rules', {
        reservationPaymentPercent,
        cancellationPolicy,
        cancellationTiers,
      });
      window.showToast?.('تنظیمات با موفقیت ذخیره شد.', 'success');
      onSaved?.();
    } catch {
      setError('خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="py-8 text-center text-gray-600">در حال بارگذاری...</div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-800 mb-2">
              درصد مبلغ قابل پرداخت در زمان رزرو
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={reservationPaymentPercent}
                onChange={(e) => setReservationPaymentPercent(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-lg font-bold w-12 text-right">{reservationPaymentPercent}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              ۱۰۰٪ = کل مبلغ سرویس، ۰٪ = بدون پرداخت در زمان رزرو
            </p>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-2">لغو رزرو مجاز است</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cancellationPolicy"
                  checked={cancellationPolicy === 'tiered'}
                  onChange={() => setCancellationPolicy('tiered')}
                  className="w-4 h-4 text-primary-600"
                />
                <span>بله (با جریمه تدریجی)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cancellationPolicy"
                  checked={cancellationPolicy === 'not_accepted'}
                  onChange={() => setCancellationPolicy('not_accepted')}
                  className="w-4 h-4 text-primary-600"
                />
                <span>خیر</span>
              </label>
            </div>
            {cancellationPolicy === 'not_accepted' && (
              <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                لغو رزرو مجاز نیست. مبلغ پرداختی عودت داده نمی‌شود.
              </p>
            )}
          </div>

          {cancellationPolicy === 'tiered' && (
            <div>
              <label className="block font-semibold text-gray-800 mb-3">
                درصد جریمه لغو بر اساس زمان
              </label>
              <div className="space-y-3">
                {TIER_LABELS.map(({ minHoursBefore, label }) => {
                  const tier = cancellationTiers.find((t) => t.minHoursBefore === minHoursBefore);
                  const feePercent = tier?.feePercent ?? 100;
                  return (
                    <div key={minHoursBefore} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-700 flex-1">{label}</span>
                      <div className="flex items-center gap-2 w-28">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={feePercent}
                          onChange={(e) =>
                            handleTierChange(
                              minHoursBefore,
                              Math.min(100, Math.max(0, Number(e.target.value) || 0))
                            )
                          }
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm font-bold mt-5 text-center text-gray-600 mt-2">
                ۰٪ = بازپرداخت کامل، ۱۰۰٪ = بدون بازپرداخت
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-success-500 text-white font-bold rounded-md hover:bg-success-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      )}
    </div>
  );
}
