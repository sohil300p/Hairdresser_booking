import React, { useState, useEffect, useCallback } from 'react';
import type { AppContextType, ServiceItemApi, BarbershopSearchResult, AvailabilitySlot } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Calendar } from '../components/Calendar';
import { StepIndicator } from '../components/StepIndicator';
import { Modal } from '../components/Modal';
import { api } from '../utils/api';
import { CANCELLATION_POLICY_TEXT } from '../constants/policies';

const STEP_LABELS = ['آرایشگاه', 'سرویس', 'تاریخ', 'هویت', 'خلاصه', 'پرداخت'];
const TOTAL_STEPS = 6;

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [minBookableDate, setMinBookableDate] = useState<Date | null>(null);
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
  const [otpSheetOpen, setOtpSheetOpen] = useState(false);
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
    // Important: use LOCAL date (not UTC) to avoid off-by-one day issues.
    const dateStr = toLocalDateString(selectedDate);
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

  // When entering Step 3, ask backend for the earliest bookable date (policy-aware).
  useEffect(() => {
    if (step !== 3 || !selectedService || !idToUse) return;
    setLoading(true);
    api
      .get<{ success: boolean; startDate?: string; message?: string }>(
        `/appointments/start-date?barbershopId=${idToUse}&serviceId=${selectedService.id}`
      )
      .then((res) => {
        if (res.success && res.startDate) {
          const d = new Date(res.startDate);
          d.setHours(0, 0, 0, 0);
          setMinBookableDate(d);
          // If current selected date is before backend start date, jump forward.
          if (selectedDate.getTime() < d.getTime()) {
            setSelectedDate(d);
            setSelectedTime(null);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedService?.id, idToUse]);

  // If date/service changes, previously selected time may become invalid.
  useEffect(() => {
    if (!selectedTime) return;
    const isStillAvailable = slots.some((s) => s.available && s.time === selectedTime);
    if (!isStillAvailable) setSelectedTime(null);
  }, [slots, selectedTime]);

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
          setOtpSheetOpen(false);
          setStep(5);
          context.showToast('ورود با موفقیت انجام شد', 'success');
        }
      })
      .catch((e) => context.showToast(e?.message ?? 'کد نادرست است', 'error'))
      .finally(() => setLoading(false));
  };

  const openOtpSheet = () => {
    setOtpSheetOpen(true);
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
    const dateStr = toLocalDateString(selectedDate);
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

  const canAdvance = () => {
    if (step === 1) return preselected ? !!selectedService : !!idToUse;
    if (step === 2) return !!selectedService;
    if (step === 3) return !!selectedTime && slots.some((s) => s.available && s.time === selectedTime);
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Modal isOpen={otpSheetOpen} onClose={() => setOtpSheetOpen(false)} position="bottom">
        <div className="p-5" dir="rtl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon name="phone" className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)]">تأیید هویت</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">نام و شماره تلفن خود را وارد کنید</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1.5">نام</label>
              <input
                type="text"
                placeholder="نام و نام خانوادگی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1.5">شماره تلفن</label>
              <input
                type="tel"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                dir="ltr"
              />
            </div>
            {!otpSent ? (
              <Button onClick={sendOtp} disabled={loading}>دریافت کد تأیید</Button>
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
                    className="w-full rounded-xl border border-gray-200 p-3 text-center text-lg font-mono tracking-[0.5em] focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    dir="ltr"
                  />
                </div>
                <Button onClick={verifyOtp} disabled={loading}>تأیید و ادامه</Button>
              </>
            )}
          </div>
        </div>
      </Modal>
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="flex items-center p-4">
          <button type="button" onClick={goBack} className="absolute right-4 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Icon name="chevronRight" className="w-5 h-5 text-[var(--md-sys-color-on-surface)]" />
          </button>
          <h1 className="text-lg font-bold text-center flex-1 text-[var(--md-sys-color-on-surface)]">
            {preselected && barbershopName ? barbershopName : 'رزرو جدید'}
          </h1>
        </div>
        {/* Step indicator */}
        <div className="px-4 pb-2">
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* ───── STEP 1: Salon + Services ───── */}
        {step === 1 && (
          <>
            {!preselected && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200">
                <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-3">انتخاب آرایشگاه</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="نام آرایشگاه را جستجو کنید..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <Button onClick={handleSearch} disabled={loading} className="!w-auto !px-5">
                    <Icon name="search" className="w-5 h-5" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {searchResults.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => selectBarbershop(b)}
                          className={`w-full text-right p-4 rounded-xl border transition-all active:scale-[0.98] flex items-center gap-3 ${
                            barbershopId === b.id
                              ? 'border-[var(--md-sys-color-primary)] bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Icon name="home" className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <span className="font-medium text-[var(--md-sys-color-on-surface)]">{b.name}</span>
                            {b.address && <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>}
                          </div>
                          {b.averageRating > 0 && (
                            <div className="mr-auto flex items-center gap-1 text-xs text-amber-600">
                              <Icon name="star" className="w-3.5 h-3.5" />
                              {b.averageRating.toFixed(1)}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {idToUse > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200">
                <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">
                  {barbershopName || 'آرایشگاه'}
                </h2>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">سرویس مورد نظر خود را انتخاب کنید</p>
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`w-full text-right p-4 rounded-xl border transition-all active:scale-[0.98] ${
                          selectedService?.id === s.id
                            ? 'border-[var(--md-sys-color-primary)] bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--md-sys-color-on-surface)]">{s.name}</span>
                          {selectedService?.id === s.id && (
                            <div className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {s.price != null && (
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                            <span>{s.price.toLocaleString('fa-IR')} تومان</span>
                            <span className="text-gray-300">|</span>
                            <span>{s.estimatedTime} دقیقه</span>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ───── STEP 2: Service + Price + Promo ───── */}
        {step === 2 && selectedService && (
          <>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-3">جزئیات سرویس</h2>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-[var(--md-sys-color-primary)] flex items-center justify-center flex-shrink-0">
                  <Icon name="tag" className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--md-sys-color-on-surface)]">{selectedService.name}</p>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    {basePrice.toLocaleString('fa-IR')} تومان — {selectedService.estimatedTime} دقیقه
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">کد تخفیف</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">
                اعمال کد پس از تأیید شماره انجام می‌شود
              </p>
              <input
                type="text"
                placeholder="کد تخفیف را وارد کنید"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </>
        )}

        {/* ───── STEP 3: Date + Time ───── */}
        {step === 3 && selectedService && (
          <>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-4">انتخاب تاریخ</h2>
              <Calendar
                selectedDate={selectedDate}
                minDate={minBookableDate ?? undefined}
                onDateSelect={(d) => {
                  // changing date invalidates selected time
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
              />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-4">انتخاب ساعت</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-[var(--md-sys-color-primary)] rounded-full animate-spin" />
                </div>
              ) : slots.filter((s) => s.available).length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {slots.filter((s) => s.available).map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setSelectedTime(s.time)}
                      className={`p-2.5 rounded-xl text-center font-mono text-sm min-h-[44px] transition-all active:scale-95 ${
                        selectedTime === s.time
                          ? 'bg-[var(--md-sys-color-primary)] text-white shadow-md'
                          : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--md-sys-color-on-surface-variant)]">
                  <Icon name="clock" className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">ساعتی برای این تاریخ موجود نیست</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ───── STEP 4: OTP ───── */}
        {step === 4 && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="user" className="w-8 h-8 text-[var(--md-sys-color-primary)]" />
            </div>
            <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-2">تأیید هویت</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6 max-w-xs mx-auto">
              برای ادامه فرآیند رزرو، نام و شماره تلفن خود را وارد کنید و با کد OTP هویت خود را تأیید کنید.
            </p>
            <Button onClick={openOtpSheet}>
              ورود با شماره تلفن
            </Button>
          </div>
        )}

        {/* ───── STEP 5: Summary + Policies ───── */}
        {step === 5 && selectedService && (
          <>
            {/* Booking summary card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-4">خلاصه رزرو</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="home" className="w-4.5 h-4.5 text-[var(--md-sys-color-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">آرایشگاه</p>
                    <p className="font-medium text-[var(--md-sys-color-on-surface)]">{barbershopName || idToUse}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="tag" className="w-4.5 h-4.5 text-[var(--md-sys-color-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">سرویس</p>
                    <p className="font-medium text-[var(--md-sys-color-on-surface)]">{selectedService.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="calendar" className="w-4.5 h-4.5 text-[var(--md-sys-color-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">تاریخ و ساعت</p>
                    <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                      {selectedDate.toLocaleDateString('fa-IR')} — {selectedTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-3">هزینه</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[var(--md-sys-color-on-surface-variant)]">
                  <span>{selectedService.name}</span>
                  <span className="font-mono">{basePrice.toLocaleString('fa-IR')} تومان</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>تخفیف</span>
                    <span className="font-mono">- {couponApplied.discount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[var(--md-sys-color-on-surface)] pt-2 border-t border-gray-100">
                  <span>مبلغ نهایی</span>
                  <span className="font-mono text-[var(--md-sys-color-primary)]">{finalPrice.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>
            </div>

            {/* Coupon card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-3">کد تخفیف</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="کد تخفیف را وارد کنید"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Button variant="secondary" onClick={validateCoupon} disabled={loading} className="!w-auto !px-5">
                  اعمال
                </Button>
              </div>
            </div>

            {/* Policy card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-3">قوانین لغو و استرداد</h2>
              <div className="p-3 rounded-xl bg-gray-50 text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-h-32 overflow-auto whitespace-pre-line">
                {CANCELLATION_POLICY_TEXT}
              </div>
              <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${policyAcknowledged ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]' : 'border-gray-300 bg-white'}`}>
                  {policyAcknowledged && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={policyAcknowledged} onChange={(e) => setPolicyAcknowledged(e.target.checked)} className="sr-only" />
                <span className="text-sm text-[var(--md-sys-color-on-surface)]">قوانین لغو و استرداد را خواندم و می‌پذیرم</span>
              </label>
            </div>
          </>
        )}

        {/* ───── STEP 6: Redirecting ───── */}
        {step === 6 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-[var(--md-sys-color-primary)] rounded-full animate-spin" />
            </div>
            <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-2">در حال انتقال</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">در حال انتقال به درگاه پرداخت...</p>
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {step < 4 && (
          <Button
            onClick={() => {
              if (!canAdvance()) return;
              setStep((s) => Math.min(s + 1, TOTAL_STEPS));
            }}
            disabled={!canAdvance()}
          >
            مرحله بعد
          </Button>
        )}
        {step === 4 && (
          <Button onClick={openOtpSheet}>
            ورود با شماره تلفن
          </Button>
        )}
        {step === 5 && (
          <Button
            onClick={createAndPay}
            disabled={!context.user || !policyAcknowledged || loading}
          >
            {loading ? 'در حال پردازش...' : 'ادامه به درگاه پرداخت'}
          </Button>
        )}
      </div>
    </div>
  );
};
