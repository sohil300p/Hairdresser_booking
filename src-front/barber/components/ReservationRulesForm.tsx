import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getEffectivePolicy, putBarbershopPolicy } from '../services/reservation-policies.service';

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
  const [slotGranularityMinutes, setSlotGranularityMinutes] = useState(30);
  const [minAdvanceMinutes, setMinAdvanceMinutes] = useState(60);
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState(0);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(0);
  const [reminderScheduleMinutes, setReminderScheduleMinutes] = useState<string>('1440,120');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const fetchRules = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Prefer new fully-customizable policies
        const p = await getEffectivePolicy();
        if (p.success && p.data) {
          setReservationPaymentPercent(p.data.depositPercent ?? 100);
          setCancellationPolicy((p.data.cancellationPolicy as any) ?? 'tiered');
          setCancellationTiers(p.data.cancellationTiers?.length ? (p.data.cancellationTiers as any) : DEFAULT_TIERS);
          setSlotGranularityMinutes(p.data.slotGranularityMinutes ?? 30);
          setMinAdvanceMinutes(p.data.minAdvanceMinutes ?? 60);
          setBufferBeforeMinutes(p.data.bufferBeforeMinutes ?? 0);
          setBufferAfterMinutes(p.data.bufferAfterMinutes ?? 0);
          setReminderScheduleMinutes((p.data.reminderScheduleMinutes ?? [1440, 120]).join(','));
          return;
        }

        // Fallback: legacy reservation rules
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
      const schedule = reminderScheduleMinutes
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);

      // Save via new policy system (barbershop override)
      await putBarbershopPolicy({
        depositPercent: reservationPaymentPercent,
        cancellationPolicy,
        cancellationTiers,
        slotGranularityMinutes,
        minAdvanceMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        reminderScheduleMinutes: schedule.length ? schedule : [1440, 120],
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-800 mb-2">گام زمانی (دقیقه)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={slotGranularityMinutes}
                onChange={(e) => setSlotGranularityMinutes(Math.max(5, Number(e.target.value) || 30))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-2">حداقل زمان رزرو قبل از موعد (دقیقه)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={minAdvanceMinutes}
                onChange={(e) => setMinAdvanceMinutes(Math.max(0, Number(e.target.value) || 60))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-2">بافر قبل (دقیقه)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={bufferBeforeMinutes}
                onChange={(e) => setBufferBeforeMinutes(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-2">بافر بعد (دقیقه)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={bufferAfterMinutes}
                onChange={(e) => setBufferAfterMinutes(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-2">یادآوری‌ها (دقیقه قبل از شروع)</label>
            <input
              type="text"
              value={reminderScheduleMinutes}
              onChange={(e) => setReminderScheduleMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="مثلاً: 1440,120"
            />
            <p className="text-sm text-gray-600 mt-1">با کاما جدا کنید. مثال: 1440=24 ساعت، 120=2 ساعت</p>
          </div>

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
