import React, { useState, useEffect, useCallback } from 'react';
import type { AppContextType, ServiceItemApi, BarbershopSearchResult, AvailabilitySlot } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Calendar } from '../components/Calendar';
import { api } from '../utils/api';
import { CANCELLATION_POLICY_TEXT } from '../constants/policies';

const STEPS = 6;

export const FastPathReservePage: React.FC<{ context: AppContextType }> = ({ context }) => {
  const preselected = context.pageParams?.barbershopId != null;
  const [step, setStep] = useState(1);
  const [barbershopId, setBarbershopId] = useState<number | null>(context.pageParams?.barbershopId ?? null);
  const [barbershopName, setBarbershopName] = useState<string>(context.pageParams?.barbershopName ?? '');
  const [services, setServices] = useState<ServiceItemApi[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItemApi | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; message: string } | null>(null);
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarbershopSearchResult[]>([]);

  const idToUse = barbershopId ?? context.pageParams?.barbershopId ?? 0;

  useEffect(() => {
    if (idToUse > 0) {
      api
        .get<{ success: boolean; data?: { services: ServiceItemApi[] } }>(`/barbershop/${idToUse}/services`)
        .then((res) => {
          if (res.success && res.data?.services) setServices(res.data.services);
        })
        .catch(() => context.showToast('خطا در بارگذاری خدمات', 'error'));
    }
  }, [idToUse, context]);

  useEffect(() => {
    if (idToUse > 0 && !barbershopName && context.pageParams?.barbershopName) {
      setBarbershopName(context.pageParams.barbershopName);
    } else if (idToUse > 0 && !barbershopName) {
      api
        .get<{ success: boolean; data?: { name?: string } }>(`/barbershop/${idToUse}/overview`)
        .then((res) => {
          if (res.success && res.data?.name) setBarbershopName(res.data.name);
        })
        .catch(() => {});
    }
  }, [idToUse, barbershopName, context.pageParams?.barbershopName]);

  const fetchAvailability = useCallback(() => {
    if (!idToUse || !selectedService) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    setLoading(true);
    api
      .get<{ success: boolean; availableSlots?: AvailabilitySlot[] }>(
        `/appointments/availability?barbershopId=${idToUse}&date=${dateStr}&serviceId=${selectedService.id}`
      )
      .then((res) => {
        if (res.success && res.availableSlots) setSlots(res.availableSlots);
        else setSlots([]);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [idToUse, selectedService, selectedDate]);

  useEffect(() => {
    if (step === 3 && selectedService) fetchAvailability();
  }, [step, selectedDate, selectedService, fetchAvailability]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    api
      .get<{ data?: { barbershops?: BarbershopSearchResult[] } }>(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
      .then((res) => {
        const list = res.data?.barbershops ?? [];
        setSearchResults(Array.isArray(list) ? list : []);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setLoading(false));
  };

  const selectBarbershop = (b: BarbershopSearchResult) => {
    setBarbershopId(b.id);
    setBarbershopName(b.name);
    setSearchResults([]);
  };

  const sendOtp = () => {
    if (!phone.trim()) {
      context.showToast('شماره تلفن را وارد کنید', 'error');
      return;
    }
    setLoading(true);
    api
      .post<{ success: boolean }>('/otp/send', { phone: phone.trim() })
      .then((res) => {
        if (res.success) {
          setOtpSent(true);
          context.showToast('کد تأیید ارسال شد', 'success');
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'خطا در ارسال کد', 'error'))
      .finally(() => setLoading(false));
  };

  const verifyOtp = () => {
    if (!otp.trim() || otp.length !== 4) {
      context.showToast('کد ۴ رقمی را وارد کنید', 'error');
      return;
    }
    setLoading(true);
    api
      .post<{ success: boolean; token?: string; user?: { name: string; phone: string } }>('/auth/login/otp', {
        phone: phone.trim(),
        otp: otp.trim(),
        fullName: name.trim() || undefined,
      })
      .then((res) => {
        if (res.success && res.token && res.user) {
          context.login(res.user as any, res.token);
          context.hideModal();
          setStep(5);
          context.showToast('ورود با موفقیت انجام شد', 'success');
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'کد نادرست است', 'error'))
      .finally(() => setLoading(false));
  };

  const openOtpSheet = () => {
    context.showModal(
      <div className="p-4" dir="rtl">
        <h3 className="font-bold text-lg mb-4">نام و شماره تلفن</h3>
        <input
          type="text"
          placeholder="نام"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input w-full mb-3 rounded-lg border p-2"
        />
        <input
          type="tel"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="form-input w-full mb-3 rounded-lg border p-2"
        />
        {!otpSent ? (
          <Button onClick={sendOtp} disabled={loading}>دریافت کد تأیید</Button>
        ) : (
          <>
            <input
              type="text"
              placeholder="کد ۴ رقمی"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="form-input w-full mb-3 rounded-lg border p-2 text-center font-mono"
            />
            <Button onClick={verifyOtp} disabled={loading}>تأیید و ادامه</Button>
          </>
        )}
      </div>,
      'bottom'
    );
  };

  const validateCoupon = () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    api
      .post<{ success: boolean; discount?: number; message?: string }>('/coupons/validate', { code: couponCode.trim() })
      .then((res) => {
        if (res.success && res.discount != null) {
          setCouponApplied({ discount: res.discount, message: res.message ?? 'تخفیف اعمال شد' });
          context.showToast(res.message ?? 'تخفیف اعمال شد', 'success');
        } else {
          setCouponApplied(null);
          context.showToast((res as { message?: string }).message ?? 'کد نامعتبر است', 'error');
        }
      })
      .catch((e) => {
        setCouponApplied(null);
        context.showToast(e?.message ?? 'خطا در اعمال کد', 'error');
      })
      .finally(() => setLoading(false));
  };

  const basePrice = selectedService?.price ?? 0;
  const discount = couponApplied?.discount ?? 0;
  const finalPrice = Math.max(0, basePrice - discount);

  const createAndPay = () => {
    if (!context.user || !selectedService || !selectedTime) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    setLoading(true);
    api
      .post<{ success: boolean; paymentUrl?: string; appointmentId?: number }>('/appointments', {
        barbershopId: idToUse,
        serviceId: selectedService.id,
        date: dateStr,
        time: selectedTime,
        locationType: 'barbershop_fixed',
        couponCode: couponCode.trim() || undefined,
        paymentMethod: 'online',
      })
      .then((res) => {
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else if (res.success && res.appointmentId) {
          context.setCurrentPage('confirmation', { appointmentId: res.appointmentId });
        } else {
          context.showToast('در حال حاضر امکان پرداخت آنلاین نیست', 'error');
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'خطا در ثبت رزرو', 'error'))
      .finally(() => setLoading(false));
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else context.setCurrentPage('fastpath-landing');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <header className="sticky top-0 bg-white z-10 flex items-center p-4 shadow-sm">
        <button type="button" onClick={goBack} className="absolute right-4">
          <Icon name="chevronRight" className="w-6 h-6 text-[var(--md-sys-color-on-surface)]" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 text-[var(--md-sys-color-on-surface)]">
          رزرو جدید {preselected ? `— ${barbershopName || 'آرایشگاه'}` : `— مرحله ${step} از ${STEPS}`}
        </h1>
      </header>

      <div className="p-4 flex-1 overflow-auto">
        {step === 1 && (
          <>
            {!preselected && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="جستجوی آرایشگاه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 rounded-lg border p-2"
                  />
                  <Button onClick={handleSearch} disabled={loading}>جستجو</Button>
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {searchResults.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => selectBarbershop(b)}
                          className="w-full text-right p-3 rounded-lg border bg-white"
                        >
                          {b.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {idToUse > 0 && (
              <>
                <p className="font-bold text-[var(--md-sys-color-on-surface)] mb-2">
                  {barbershopName || 'آرایشگاه'} — انتخاب سرویس
                </p>
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`w-full text-right p-3 rounded-lg border ${selectedService?.id === s.id ? 'border-[var(--md-sys-color-primary)] bg-blue-50' : 'bg-white'}`}
                      >
                        <span className="font-medium">{s.name}</span>
                        {s.price != null && (
                          <span className="block text-sm text-gray-600">
                            {s.price.toLocaleString('fa-IR')} تومان — {s.estimatedTime} دقیقه
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {step === 2 && selectedService && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border">
              <p className="font-bold mb-2">{selectedService.name}</p>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                مبلغ: {basePrice.toLocaleString('fa-IR')} تومان
              </p>
            </div>
            <div>
              <label className="block font-bold mb-1">کد تخفیف</label>
              <input
                type="text"
                placeholder="کد را وارد کنید"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                اعمال کد پس از تأیید شماره انجام می‌شود.
              </p>
            </div>
          </div>
        )}

        {step === 3 && selectedService && (
          <>
            <p className="font-bold mb-2">انتخاب تاریخ و ساعت</p>
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            <p className="font-bold mt-4 mb-2">ساعات موجود</p>
            {loading ? (
              <p className="text-sm text-gray-500">در حال بارگذاری...</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.filter((s) => s.available).map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setSelectedTime(s.time)}
                    className={`p-2 rounded-lg text-center font-mono text-sm min-h-[44px] ${selectedTime === s.time ? 'bg-[var(--md-sys-color-primary)] text-white' : 'bg-white border'}`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <p className="mb-4">برای ادامه، نام و شماره تلفن خود را وارد کرده و با کد OTP هویت خود را تأیید کنید.</p>
            <Button onClick={openOtpSheet}>ورود با شماره تلفن</Button>
          </div>
        )}

        {step === 5 && selectedService && (
          <>
            <div className="bg-white p-4 rounded-xl border space-y-2 mb-4">
              <p><strong>آرایشگاه:</strong> {barbershopName || idToUse}</p>
              <p><strong>سرویس:</strong> {selectedService.name}</p>
              <p><strong>تاریخ:</strong> {selectedDate.toLocaleDateString('fa-IR')}</p>
              <p><strong>ساعت:</strong> {selectedTime}</p>
              <p><strong>مبلغ پایه:</strong> {basePrice.toLocaleString('fa-IR')} تومان</p>
              {couponApplied && <p className="text-green-600">تخفیف: {couponApplied.discount.toLocaleString('fa-IR')} تومان</p>}
              <p><strong>مبلغ نهایی:</strong> {finalPrice.toLocaleString('fa-IR')} تومان</p>
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">کد تخفیف</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="کد را وارد کنید"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-lg border p-2"
                />
                <Button variant="secondary" onClick={validateCoupon} disabled={loading}>اعمال</Button>
              </div>
            </div>
            <div className="mb-4 p-3 rounded-lg bg-gray-100 text-sm overflow-auto max-h-32">
              {CANCELLATION_POLICY_TEXT}
            </div>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={policyAcknowledged}
                onChange={(e) => setPolicyAcknowledged(e.target.checked)}
              />
              <span>قوانین لغو و استرداد را خواندم و می‌پذیرم.</span>
            </label>
          </>
        )}

        {step === 6 && (
          <p className="text-center text-[var(--md-sys-color-on-surface-variant)]">در حال انتقال به درگاه پرداخت...</p>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        {step < 4 && (
          <Button
            onClick={() => {
              if (step === 1 && (!preselected ? !idToUse : !selectedService)) return;
              if (step === 2 && !selectedService) return;
              if (step === 3 && !selectedTime) return;
              setStep((s) => Math.min(s + 1, STEPS));
            }}
            disabled={
              (step === 1 && (preselected ? !selectedService : !idToUse)) ||
              (step === 2 && !selectedService) ||
              (step === 3 && !selectedTime)
            }
          >
            بعدی
          </Button>
        )}
        {step === 4 && (
          <Button onClick={openOtpSheet}>ورود با شماره تلفن</Button>
        )}
        {step === 5 && (
          <Button
            onClick={createAndPay}
            disabled={!context.user || !policyAcknowledged || loading}
          >
            ادامه به درگاه پرداخت
          </Button>
        )}
      </div>
    </div>
  );
};
