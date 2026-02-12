
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Edit, Plus, Trash2, CreditCard, Clock, Tag, LogOut, HelpCircle, FileText, Star, Percent, CalendarPlus, History, Copy, Send, Accessibility, MapPin, ArrowRight, ArrowUpRight, Gift, Banknote, UserPlus } from 'lucide-react';
import BottomSheet from './BottomSheet';
import ConfirmationDialog from './ConfirmationDialog';
import MaterialInput from './MaterialInput';
import EditProfileScreen from './EditProfileScreen';
import MaterialSelect from './MaterialSelect';
import EditScheduleScreen from './EditScheduleScreen';
import { Screen } from '../App';
import ServicesSubPage from './ServicesSubPage';
import TermsSubPage from './TermsSubPage';
import CustomerReviewsScreen from './CustomerReviewsScreen';
import SupportScreen from './SupportScreen';
import ReservationRulesForm from './ReservationRulesForm';
import FinanceManagementSheet from './FinanceManagementSheet';
import BarbershopSeatsSheet from './BarbershopSeatsSheet';
import { api } from '../utils/api';
import type {
  GetBarberProfileResponse,
  GetCouponsResponse,
  GetWalletBalanceResponse,
  GetPaymentHistoryResponse,
  GetCustomersResponse,
  CouponItem,
} from '../types/api';

const KEY_ORDER = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const WEEKDAY_BY_KEY: Record<string, number> = { saturday: 6, sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
const DAY_NAMES: Record<string, string> = { saturday: 'شنبه', sunday: 'یکشنبه', monday: 'دوشنبه', tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنج‌شنبه', friday: 'جمعه' };


interface ProfileScreenProps {
    onLogout: () => void;
    setIsSubPageActive: (isActive: boolean) => void;
    isLargeFont: boolean;
    setIsLargeFont: (value: boolean) => void;
    isHighContrast: boolean;
    setIsHighContrast: (value: boolean) => void;
    isVoiceAssistantEnabled: boolean;
    setIsVoiceAssistantEnabled: (value: boolean) => void;
    isAutoConfirmEnabled: boolean;
    setIsAutoConfirmEnabled: (value: boolean) => void;
    setActiveScreen: (screen: Screen) => void;
}

interface Schedule {
    key: string;
    name: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

interface Discount {
    id: number;
    code: string;
    percentage: number;
    description: string;
    isActive: boolean;
    applicableServices: number[];
    validFrom: string;
    validTo: string;
}

interface Service {
    id: number;
    name: string;
    price: number;
    duration: number;
    description?: string;
    sampleImage?: string;
}

interface Withdrawal {
    id: number;
    amount: number;
    date: string;
    status: 'completed' | 'pending';
}

interface Customer {
  id: number;
  name: string;
  avatar: string;
  phone: string;
}

// Initial Data...
const initialSchedule: Schedule[] = [
    { key: 'saturday', name: 'شنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'sunday', name: 'یکشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'monday', name: 'دوشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'tuesday', name: 'سه‌شنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'wednesday', name: 'چهارشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'thursday', name: 'پنج‌شنبه', isActive: true, startTime: '10:00', endTime: '16:00' },
    { key: 'friday', name: 'جمعه', isActive: false, startTime: '09:00', endTime: '18:00' },
];

const initialDiscounts: Discount[] = [
    { id: 1, code: 'EID1403', percentage: 20, description: 'تخفیف ویژه عید', isActive: true, applicableServices: [], validFrom: '1403/04/01', validTo: '1403/04/10' },
    { id: 2, code: 'NEWCUT', percentage: 15, description: 'اولین اصلاح', isActive: false, applicableServices: [1], validFrom: '1403/05/01', validTo: '1403/06/01' },
];

const initialServices: Service[] = [
    { id: 1, name: 'اصلاح مو', price: 100000, duration: 30, description: 'اصلاح حرفه‌ای مو با جدیدترین متدها', sampleImage: 'https://picsum.photos/seed/haircut/400/300' },
    { id: 2, name: 'اصلاح مو + ریش', price: 150000, duration: 45, description: 'سرویس کامل اصلاح مو و ریش', sampleImage: 'https://picsum.photos/seed/beard/400/300' },
    { id: 3, name: 'کراتینه', price: 800000, duration: 120, description: 'کراتینه و احیای موهای آسیب‌دیده', sampleImage: 'https://picsum.photos/seed/keratin/400/300' },
];

const withdrawalHistory: Withdrawal[] = [
    { id: 1, amount: 500000, date: '1403/05/01', status: 'completed' },
    { id: 2, amount: 250000, date: '1403/04/15', status: 'completed' },
];



function mapApiScheduleToSchedule(schedules: { weekday: number; openTime: string; closeTime: string; isClosed: boolean }[]): Schedule[] {
    const byWeekday = new Map<number, { openTime: string; closeTime: string; isClosed: boolean }>();
    schedules.forEach(s => byWeekday.set(s.weekday, { openTime: s.openTime, closeTime: s.closeTime, isClosed: s.isClosed }));
    return KEY_ORDER.map(key => {
        const w = WEEKDAY_BY_KEY[key];
        const s = byWeekday.get(w);
        return {
            key,
            name: DAY_NAMES[key],
            isActive: s ? !s.isClosed : true,
            startTime: s?.openTime || '09:00',
            endTime: s?.closeTime || '18:00',
        };
    });
}

function mapScheduleToApi(schedule: Schedule[]) {
    return schedule.map(s => ({
        weekday: WEEKDAY_BY_KEY[s.key],
        openTime: s.startTime,
        closeTime: s.endTime,
        isClosed: !s.isActive,
    }));
}

function mapCouponToDiscount(c: CouponItem): Discount {
    const percentage = c.kind === 'percentage' && c.value != null ? c.value : 0;
    return {
        id: c.id,
        code: c.code,
        percentage,
        description: c.kind === 'percentage' ? `${percentage}% تخفیف` : c.kind === 'fixed' ? `تخفیف ${c.value} تومان` : 'رایگان',
        isActive: (c.usageMax == null || c.usageCount < c.usageMax) && (c.expiresAt == null || c.expiresAt > Date.now()),
        applicableServices: c.serviceId ? [c.serviceId] : [],
        validFrom: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fa-IR') : '',
        validTo: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fa-IR') : '',
    };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, setIsSubPageActive, isLargeFont, setIsLargeFont, isHighContrast, setIsHighContrast, isVoiceAssistantEnabled, setIsVoiceAssistantEnabled, isAutoConfirmEnabled, setIsAutoConfirmEnabled, setActiveScreen }) => {
    type SheetName = 'wallet' | 'discounts' | 'accessibility' | 'sendSms' | 'bookingSettings' | 'finance' | 'seats';
    const [isSheetOpen, setSheetOpen] = useState<SheetName | null>(null);
    const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

    useEffect(() => {
        setIsSubPageActive(activeSubPage !== null);
    }, [activeSubPage, setIsSubPageActive]);

    const [profileData, setProfileData] = useState({ name: 'سالن زیبایی شما', address: '', about: '', gender: 'female' as 'male' | 'female' | 'unisex' });
    const [avatar, setAvatar] = useState('https://picsum.photos/id/1027/100/100');
    const [background, setBackground] = useState('https://picsum.photos/seed/barbershop/600/400');
    const [schedule, setSchedule] = useState<Schedule[]>(initialSchedule);
    const [services, setServices] = useState<Service[]>(initialServices);
    const [discounts, setDiscounts] = useState<Discount[]>([]);

    const [bankCard, setBankCard] = useState({ number: '', name: '', shaba: '' });
    const [newCard, setNewCard] = useState({ number: '', name: '', shaba: '' });
    const [cardErrors, setCardErrors] = useState({ number: '', name: '', shaba: '' });
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [walletView, setWalletView] = useState<'main' | 'addCard' | 'history'>('main');
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Array<{ id: number; amount: number; date: string; status: string }>>([]);

    const [discountSheetView, setDiscountSheetView] = useState<'list' | 'form'>('list');
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [discountForSms, setDiscountForSms] = useState<Discount | null>(null);
    const [smsCustomers, setSmsCustomers] = useState<Customer[]>([]);

    const fetchProfile = useCallback(async () => {
        try {
            const [res, defaultsRes] = await Promise.all([
                api.get<GetBarberProfileResponse>('/barber/profile'),
                api.get<{ success: boolean; data?: { defaultBarberProfileImageUrl: string; defaultBarberHeaderImageUrl: string } }>('/settings/default-images').catch(() => ({ success: false, data: undefined })),
            ]);
            const defaultProfile = defaultsRes?.data?.defaultBarberProfileImageUrl || 'https://picsum.photos/id/1027/100/100';
            const defaultHeader = defaultsRes?.data?.defaultBarberHeaderImageUrl || 'https://picsum.photos/seed/barbershop/600/400';
            if (res.success && res.data) {
                const b = res.data.barbershop;
                setProfileData({ name: b.name, address: b.address || '', about: b.description || '', gender: b.gender });
                setAvatar(b.profileImage || defaultProfile);
                setBackground(b.backgroundImage || defaultHeader);
                if (res.data.schedules?.length) setSchedule(mapApiScheduleToSchedule(res.data.schedules));
                if (res.data.services?.length) setServices(res.data.services.map(s => ({ id: s.id, name: s.name, price: s.price ?? 0, duration: s.estimatedTime, description: s.description || undefined, sampleImage: s.avatar || undefined })));
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await api.get<GetCouponsResponse>('/barber/coupons');
            if (res.success && res.data) setDiscounts(res.data.coupons.map(mapCouponToDiscount));
        } catch { setDiscounts([]); }
    }, []);

    const fetchWalletBalance = useCallback(async () => {
        try {
            const res = await api.get<GetWalletBalanceResponse>('/barber/wallet/balance');
            if (res.success && res.balance != null) setWalletBalance(res.balance);
        } catch { setWalletBalance(null); }
    }, []);

    const fetchPaymentHistory = useCallback(async () => {
        try {
            const res = await api.get<GetPaymentHistoryResponse>('/barber/wallet/payment-history');
            if (res.success && res.data?.payments) {
                setPaymentHistory(res.data.payments.map(p => ({
                    id: p.id,
                    amount: p.price,
                    date: new Date(p.date).toLocaleDateString('fa-IR'),
                    status: p.status,
                })));
            }
        } catch { setPaymentHistory([]); }
    }, []);

    useEffect(() => {
        if (isSheetOpen === 'wallet') fetchWalletBalance();
    }, [isSheetOpen, fetchWalletBalance]);

    useEffect(() => {
        if (isSheetOpen === 'discounts') fetchCoupons();
    }, [isSheetOpen, fetchCoupons]);

    useEffect(() => {
        if (isSheetOpen === 'wallet' && walletView === 'history') fetchPaymentHistory();
    }, [isSheetOpen, walletView, fetchPaymentHistory]);

    type DialogAction = (() => void) | null;
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState({ title: '', description: '' });
    const [dialogAction, setDialogAction] = useState<DialogAction>(null);
    const [isDestructiveDialog, setDestructiveDialog] = useState(false);
    
    const handleOpenDialog = (title: string, description: string, onConfirm: () => void, isDestructive = false) => {
        setDialogContent({ title, description });
        setDialogAction(() => onConfirm); 
        setDestructiveDialog(isDestructive);
        setDialogOpen(true);
    };
    
    const handleSaveDiscount = async (discountData: Discount) => {
        try {
            const body = { code: discountData.code, kind: 'percentage' as const, value: discountData.percentage };
            if (editingDiscount) {
                await api.put(`/barber/coupons/${discountData.id}`, body);
                setDiscounts(prev => prev.map(d => d.id === discountData.id ? discountData : d));
                window.showToast('تخفیف با موفقیت ویرایش شد.', 'success');
            } else {
                const res = await api.post<{ success: boolean; data?: { coupon: CouponItem } }>('/barber/coupons', body);
                if (res.success && res.data?.coupon) {
                    setDiscounts(prev => [...prev, mapCouponToDiscount(res.data!.coupon!)]);
                    window.showToast('تخفیف جدید اضافه شد.', 'success');
                }
            }
            setDiscountSheetView('list');
            setEditingDiscount(null);
        } catch {
            window.showToast('خطا در ذخیره تخفیف', 'error');
        }
    };

    const handleDeleteDiscount = (id: number) => {
        handleOpenDialog('حذف تخفیف', 'آیا از حذف این کد تخفیف اطمینان دارید؟', () => {
            setDiscounts(prev => prev.filter(d => d.id !== id));
            window.showToast('کد تخفیف حذف شد.', 'info');
        }, true);
    };

    const handleOpenSmsSheet = async (discount: Discount) => {
        setDiscountForSms(discount);
        setSheetOpen('sendSms');
        try {
            const res = await api.get<GetCustomersResponse>('/barber/customers');
            if (res.success && res.data) {
                setSmsCustomers(res.data.customers.map(c => ({ id: c.id, name: c.fullName || 'مشتری', avatar: c.avatar || '', phone: c.phone })));
            }
        } catch {
            setSmsCustomers([]);
        }
    };
    
     // Wallet Management
    const handleAddCard = () => {
        const errors = { number: '', name: '', shaba: '' };
        let isValid = true;

        if (newCard.number.length !== 16 || !/^\d+$/.test(newCard.number)) {
            errors.number = 'شماره کارت باید ۱۶ رقم عددی باشد.';
            isValid = false;
        }
        if (!newCard.name.trim()) {
            errors.name = 'نام صاحب کارت الزامی است.';
            isValid = false;
        }
        if (newCard.shaba.length !== 24 || !/^\d+$/.test(newCard.shaba)) {
            errors.shaba = 'شماره شبا باید ۲۴ رقم عددی باشد.';
            isValid = false;
        }

        setCardErrors(errors);
        
        if (isValid) {
            setBankCard(newCard);
            setNewCard({ number: '', name: '', shaba: '' });
            setWalletView('main');
            window.showToast('کارت بانکی با موفقیت اضافه شد.', 'success');
        }
    };
    
    const handleDeleteCard = () => {
        handleOpenDialog('حذف کارت', 'آیا از حذف کارت بانکی خود اطمینان دارید؟', () => {
            setBankCard({ number: '', name: '', shaba: '' });
            window.showToast('کارت بانکی حذف شد.', 'info');
        }, true);
    };
    
    const handleWithdraw = () => {
        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            window.showToast('مبلغ برداشت نامعتبر است.', 'error');
            return;
        }
        handleOpenDialog(
            'تایید برداشت وجه',
            `آیا برداشت مبلغ ${amount.toLocaleString('fa-IR')} تومان به کارت ثبت شده را تایید می‌کنید؟`,
            async () => {
                try {
                    await api.post('/barber/wallet/withdraw', { amount, method: 'card', reference: bankCard.shaba || undefined });
                    setDialogOpen(false);
                    window.showToast('درخواست برداشت شما ثبت شد.', 'success');
                    setWithdrawalAmount('');
                    setSheetOpen(null);
                    fetchWalletBalance();
                } catch {
                    window.showToast('خطا در ثبت درخواست برداشت', 'error');
                }
            }
        );
    };

    const handleLogoutClick = () => {
        handleOpenDialog(
            'خروج از حساب',
            'آیا برای خروج از حساب کاربری خود اطمینان دارید؟',
            onLogout,
            true
        );
    };

    // Sub-page rendering
    if (activeSubPage === 'editProfile') {
        return <EditProfileScreen 
            initialProfileData={{ name: profileData.name, address: profileData.address, about: profileData.about, gender: profileData.gender }}
            initialAvatar={avatar}
            initialBackground={background}
            onBack={() => setActiveSubPage(null)}
            onSave={(newData, newAvatarFile, newBgFile) => {
                // newData includes gender
                setProfileData(newData);
                if (newAvatarFile) setAvatar(URL.createObjectURL(newAvatarFile));
                if (newBgFile) setBackground(URL.createObjectURL(newBgFile));
                setActiveSubPage(null);
                window.showToast('پروفایل با موفقیت بروزرسانی شد.', 'success');
            }}
        />
    }
    if (activeSubPage === 'editSchedule') {
        return <EditScheduleScreen 
            initialSchedule={schedule} 
            onBack={() => setActiveSubPage(null)}
            onSave={async (newSchedule) => {
                try {
                    await api.put('/barber/working-hours', { schedules: mapScheduleToApi(newSchedule) });
                    setSchedule(newSchedule);
                    setActiveSubPage(null);
                    window.showToast('ساعات کاری بروزرسانی شد.', 'success');
                } catch {
                    window.showToast('خطا در بروزرسانی ساعات کاری', 'error');
                }
            }}
        />
    }
    if (activeSubPage === 'services') {
        return <ServicesSubPage 
            initialServices={services}
            onSave={(newServices) => setServices(newServices)}
            onBack={() => setActiveSubPage(null)}
        />
    }
    if (activeSubPage === 'terms') {
        return <TermsSubPage onBack={() => setActiveSubPage(null)} />
    }
     if (activeSubPage === 'reviews') {
        // Pass an argument-accepting callback to satisfy the Screen-type signature
        return <CustomerReviewsScreen setActiveScreen={(_screen) => setActiveSubPage(null)} />
    }
     if (activeSubPage === 'support') {
        // Pass an argument-accepting callback to satisfy the Screen-type signature
        return <SupportScreen setActiveScreen={(_screen) => setActiveSubPage(null)} />
    }


    return (
        <>
            <div className="flex flex-col h-full bg-surface-1">
                 <div className="relative flex-shrink-0">
                     {/* Banner Image */}
                    <div className="h-48 w-full relative">
                         <img src={background} className="w-full h-full object-cover" alt="بکگراند پروفایل" />
                         <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    
                    {/* Profile Info Container (Overlapping) */}
                    <div className="px-4 pb-2 relative">
                        <div className="flex justify-between items-end -mt-10 mb-3">
                             <img src={avatar} alt="آواتار" className="w-24 h-24 rounded-full border-4 border-surface-1 shadow-md object-cover bg-surface-2" />
                             <button type="button" onClick={() => setActiveSubPage('editProfile')} className="mb-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <Edit size={16} />
                                ویرایش
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                                {/* Gender badge */}
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${profileData.gender === 'male' ? 'bg-blue-100 text-blue-800' : profileData.gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}`}
                                >
                                    {profileData.gender === 'male' ? 'مردانه' : profileData.gender === 'female' ? 'زنانه' : 'مختلط'}
                                </span>
                             </div>
                             <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin size={14}/>
                                {profileData.address}
                             </p>
                        </div>
                    </div>
                </div>

                <main className="flex-grow p-4 space-y-3 overflow-y-auto">
                    <div className="bg-white rounded-lg border shadow-xs p-2 space-y-1">
                        <ProfileLink icon={Clock} text="ساعات کاری" onClick={() => setActiveSubPage('editSchedule')} />
                        <ProfileLink icon={Tag} text="خدمات و قیمت‌گذاری" onClick={() => setActiveSubPage('services')} />
                        <ProfileLink icon={UserPlus} text="تیم و صندلی‌ها" onClick={() => setSheetOpen('seats')} iconRight={ArrowUpRight} />
                        <ProfileLink icon={CalendarPlus} text="تنظیمات رزرو" onClick={() => setSheetOpen('bookingSettings')} iconRight={ArrowUpRight} />
                    </div>
                    <div className="bg-white rounded-lg border shadow-xs p-2 space-y-1">
                        <ProfileLink icon={CreditCard} text="کیف پول و درآمد" onClick={() => { setWalletView('main'); setSheetOpen('wallet'); }} iconRight={ArrowUpRight}/>
                        <ProfileLink icon={Banknote} text="مدیریت مالی" onClick={() => setSheetOpen('finance')} iconRight={ArrowUpRight}/>
                        <ProfileLink icon={Gift} text="باشگاه مشتریان" onClick={() => setActiveScreen('club')} iconRight={ArrowRight} disabled={true}/>
                        <ProfileLink icon={Percent} text="مدیریت تخفیف‌ها" onClick={() => setSheetOpen('discounts')} iconRight={ArrowUpRight}/>
                        <ProfileLink icon={Star} text="نظرات مشتریان" onClick={() => setActiveSubPage('reviews')} />
                    </div>
                     <div className="bg-white rounded-lg border shadow-xs p-2 space-y-1">
                        <ProfileLink icon={Accessibility} text="دسترسی‌پذیری" onClick={() => setSheetOpen('accessibility')} iconRight={ArrowUpRight}/>
                        <ProfileLink icon={HelpCircle} text="پشتیبانی" onClick={() => setActiveSubPage('support')} />
                        <ProfileLink icon={FileText} text="قوانین و مقررات" onClick={() => setActiveSubPage('terms')} />
                    </div>
                    <div className="bg-white rounded-lg border shadow-xs p-2 space-y-1">
                        <ProfileLink 
                            icon={LogOut} 
                            text="خروج از حساب" 
                            onClick={handleLogoutClick}
                            color="text-error-600" 
                        />
                    </div>
                </main>
            </div>
            
            {/* --- SHEETS --- */}

            {/* Accessibility Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'accessibility'} onClose={() => setSheetOpen(null)} title="تنظیمات دسترسی‌پذیری">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="large-font-toggle" className="font-semibold text-gray-800">فونت بزرگ</label>
                            <p className="text-sm text-gray-600" id="large-font-desc">اندازه متن‌ها برای خوانایی بهتر بزرگ‌تر می‌شود.</p>
                        </div>
                        <ToggleSwitch enabled={isLargeFont} setEnabled={(value) => { setIsLargeFont(value); setTimeout(() => setSheetOpen(null), 300); }} id="large-font-toggle" aria-describedby="large-font-desc"/>
                    </div>
                     <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="high-contrast-toggle" className="font-semibold text-gray-800">کنتراست بالا</label>
                            <p className="text-sm text-gray-600" id="high-contrast-desc">رنگ‌ها را برای دید بهتر واضح‌تر می‌کند.</p>
                        </div>
                        <ToggleSwitch enabled={isHighContrast} setEnabled={(value) => { setIsHighContrast(value); setTimeout(() => setSheetOpen(null), 300); }} id="high-contrast-toggle" aria-describedby="high-contrast-desc"/>
                    </div>
                     <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="voice-assistant-toggle" className="font-semibold text-gray-800">دستیار صوتی</label>
                            <p className="text-sm text-gray-600" id="voice-assistant-desc">اپلیکیشن را با دستورات صوتی کنترل کنید.</p>
                        </div>
                        <ToggleSwitch enabled={isVoiceAssistantEnabled} setEnabled={(value) => { setIsVoiceAssistantEnabled(value); setTimeout(() => setSheetOpen(null), 300); }} id="voice-assistant-toggle" aria-describedby="voice-assistant-desc" />
                    </div>
                </div>
            </BottomSheet>

            {/* Booking Settings Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'bookingSettings'} onClose={() => setSheetOpen(null)} title="تنظیمات رزرو">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="auto-confirm-toggle" className="font-semibold text-gray-800">تایید خودکار رزروها</label>
                            <p className="text-sm text-gray-600" id="auto-confirm-desc">رزروهای جدید به صورت خودکار تایید می‌شوند. در صورت خاموش بودن، باید هر درخواست را به صورت دستی تایید کنید.</p>
                        </div>
                        <ToggleSwitch 
                            enabled={isAutoConfirmEnabled} 
                            setEnabled={setIsAutoConfirmEnabled} 
                            id="auto-confirm-toggle" 
                            aria-describedby="auto-confirm-desc"
                        />
                    </div>
                    <div className="border-t pt-6">
                        <ReservationRulesForm isVisible={isSheetOpen === 'bookingSettings'} />
                    </div>
                </div>
            </BottomSheet>

            {/* Finance Management Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'finance'} onClose={() => setSheetOpen(null)} title="مدیریت مالی">
                <FinanceManagementSheet
                    isOpen={isSheetOpen === 'finance'}
                    onOpenBookingSettings={() => setSheetOpen('bookingSettings')}
                />
            </BottomSheet>

            {/* Barbershop Seats / Team Sheet */}
            <BarbershopSeatsSheet isOpen={isSheetOpen === 'seats'} onClose={() => setSheetOpen(null)} />

            {/* Wallet Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'wallet'} onClose={() => setSheetOpen(null)} title="کیف پول و درآمد">
                {walletView === 'main' && (
                    <div className="space-y-4">
                        <div className="bg-primary-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-primary-800">موجودی قابل برداشت</p>
                            <p className="text-3xl font-bold text-primary-900 mt-1">
                                {walletBalance != null ? walletBalance.toLocaleString('fa-IR') : '-'} <span className="text-base font-normal">تومان</span>
                            </p>
                        </div>

                        {bankCard.number ? (
                            <div className="bg-surface-2 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-700 mb-2">کارت بانکی مقصد</p>
                                    <button type="button" onClick={handleDeleteCard} className="text-error-600 text-sm font-semibold hover:text-error-700">حذف</button>
                                </div>
                                <p className="font-semibold text-gray-800">{bankCard.name}</p>
                                <p className="font-mono font-semibold tracking-wider text-sm text-gray-600">{`**** **** **** ${bankCard.number.slice(-4)}`}</p>
                            </div>
                        ) : (
                             <div className="bg-warning-50 border border-warning-200 p-4 rounded-lg text-center">
                                <p className="text-sm text-warning-800 font-semibold">برای برداشت وجه، ابتدا کارت بانکی خود را ثبت کنید.</p>
                                <button type="button" onClick={() => setWalletView('addCard')} className="mt-3 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition hover:bg-primary-700 inline-flex items-center gap-2">
                                    <Plus size={16} />
                                    افزودن کارت بانکی
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                             <MaterialInput 
                                 id="withdrawAmount" 
                                 label="مبلغ برداشت (تومان)" 
                                 type="number" 
                                 value={withdrawalAmount} 
                                 onChange={(e) => setWithdrawalAmount(e.target.value)}
                                 disabled={!bankCard.number}
                             />
                             <button 
                                 type="button"
                                 onClick={handleWithdraw} 
                                 disabled={!withdrawalAmount || !bankCard.number} 
                                 className="w-full h-12 bg-success-500 text-white font-bold rounded-md transition hover:bg-success-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                             >
                                ثبت درخواست برداشت
                            </button>
                        </div>
                        
                        <button type="button" onClick={() => setWalletView('history')} className="w-full h-12 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition">
                            <History size={18} />
                            تاریخچه برداشت‌ها
                        </button>
                    </div>
                )}
                {walletView === 'addCard' && (
                    <div>
                        <button type="button" onClick={() => setWalletView('main')} className="text-sm text-primary-600 mb-4 flex items-center gap-1"><ArrowRight size={16}/> بازگشت</button>
                        <div className="space-y-2">
                             <div>
                                <MaterialInput id="cardholderName" label="نام و نام خانوادگی صاحب کارت" type="text" value={newCard.name} onChange={(e) => setNewCard({...newCard, name: e.target.value})} />
                                {cardErrors.name && <p className="text-sm text-error-600 px-1 pt-1">{cardErrors.name}</p>}
                             </div>
                             <div>
                                <MaterialInput id="cardNumber" label="شماره کارت ۱۶ رقمی" type="tel" value={newCard.number} onChange={(e) => setNewCard({...newCard, number: e.target.value})} maxLength={16} />
                                {cardErrors.number && <p className="text-sm text-error-600 px-1 pt-1">{cardErrors.number}</p>}
                             </div>
                             <div>
                                <MaterialInput id="shabaNumber" label="شماره شبا (۲۴ رقم بدون IR)" type="tel" value={newCard.shaba} onChange={(e) => setNewCard({...newCard, shaba: e.target.value})} maxLength={24} />
                                {cardErrors.shaba && <p className="text-sm text-error-600 px-1 pt-1">{cardErrors.shaba}</p>}
                             </div>
                             <button type="button" onClick={handleAddCard} className="w-full h-12 bg-primary-600 text-white font-bold rounded-md mt-4">افزودن کارت</button>
                        </div>
                    </div>
                )}
                {walletView === 'history' && (
                     <div>
                        <button type="button" onClick={() => setWalletView('main')} className="text-sm text-primary-600 mb-4 flex items-center gap-1"><ArrowRight size={16}/> بازگشت</button>
                        <div className="space-y-3">
                            <h3 className="font-bold">تاریخچه پرداخت‌ها</h3>
                            {paymentHistory.length > 0 ? paymentHistory.map(item => (
                                <div key={item.id} className="bg-surface-1 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{item.amount.toLocaleString('fa-IR')} تومان</p>
                                        <p className="text-xs text-gray-600">{item.date}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.status === 'success' ? 'bg-success-100 text-success-700' : item.status === 'pending' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}`}>
                                        {item.status === 'success' ? 'موفق' : item.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center text-gray-600 py-4">تاریخچه‌ای یافت نشد</p>
                            )}
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* Discounts Sheet */}
            <BottomSheet 
                isOpen={isSheetOpen === 'discounts'} 
                onClose={() => {
                    setSheetOpen(null);
                    setTimeout(() => {
                        setDiscountSheetView('list');
                        setEditingDiscount(null);
                    }, 300);
                }} 
                title={
                    discountSheetView === 'list' 
                    ? "مدیریت تخفیف‌ها" 
                    : editingDiscount 
                    ? "ویرایش تخفیف" 
                    : "افزودن تخفیف جدید"
                }
            >
                {discountSheetView === 'list' ? (
                    <div className="space-y-3">
                        {discounts.map(discount => (
                            <div key={discount.id} className="bg-surface-1 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg">{discount.code}</p>
                                        <p className="text-sm text-gray-700">{discount.percentage}% تخفیف - {discount.description}</p>
                                        <p className="text-xs text-gray-600 mt-1">معتبر از {discount.validFrom} تا {discount.validTo}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <button type="button" onClick={() => { setEditingDiscount(discount); setDiscountSheetView('form'); }} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"><Edit size={16}/></button>
                                        <button type="button" onClick={() => handleDeleteDiscount(discount.id)} className="p-2 text-error-600 hover:bg-error-100 rounded-full"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3 pt-3 border-t">
                                    <button type="button" onClick={() => navigator.clipboard.writeText(discount.code).then(() => window.showToast("کد تخفیف کپی شد", "success"))} className="flex-1 h-10 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 text-sm rounded-md font-semibold transition hover:bg-gray-300"><Copy size={14} /> کپی کد</button>
                                    <button type="button" onClick={() => handleOpenSmsSheet(discount)} className="flex-1 h-10 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 text-sm rounded-md font-semibold transition hover:bg-gray-300"><Send size={14} /> ارسال پیامک</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => { setEditingDiscount(null); setDiscountSheetView('form'); }} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition mt-4">
                            <Plus size={18}/>
                            <span>افزودن تخفیف جدید</span>
                        </button>
                    </div>
                ) : (
                    <DiscountForm 
                        key={editingDiscount ? editingDiscount.id : 'new'}
                        services={services}
                        initialData={editingDiscount}
                        onSave={handleSaveDiscount}
                        onCancel={() => { setDiscountSheetView('list'); setEditingDiscount(null); }}
                    />
                )}
            </BottomSheet>
            
            <BottomSheet isOpen={isSheetOpen === 'sendSms'} onClose={() => setSheetOpen(null)} title={`ارسال کد ${discountForSms?.code}`}>
                {discountForSms && <SendSmsSheet discount={discountForSms} customers={smsCustomers} onClose={() => setSheetOpen(null)} onSendSms={async (phoneNumbers) => {
                    try {
                        await api.post(`/barber/coupons/${discountForSms.id}/send-sms`, { couponId: discountForSms.id, phoneNumbers });
                        window.showToast(`پیامک برای ${phoneNumbers.length} مشتری ارسال شد.`, 'success');
                        setSheetOpen(null);
                    } catch {
                        window.showToast('خطا در ارسال پیامک', 'error');
                    }
                }} />}
            </BottomSheet>


            <ConfirmationDialog 
                isOpen={isDialogOpen} 
                onClose={() => setDialogOpen(false)} 
                onConfirm={() => { if(dialogAction) dialogAction(); }}
                title={dialogContent.title}
                isDestructive={isDestructiveDialog}
            >
                <p>{dialogContent.description}</p>
            </ConfirmationDialog>
        </>
    );
};


// Sub-component for Discount Form
const DiscountForm: React.FC<{ 
    services: Service[], 
    initialData: Discount | null, 
    onSave: (d: Discount) => void, 
    onCancel: () => void 
}> = ({ services, initialData, onSave, onCancel }) => {
    
    // Initialize form data based on whether we are editing or creating a new discount
    const [formData, setFormData] = useState({
        code: initialData?.code || '',
        percentage: initialData?.percentage || '',
        validFrom: initialData?.validFrom || '',
        validTo: initialData?.validTo || '',
        applicableServices: initialData?.applicableServices || [],
        description: initialData?.description || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData({...formData, applicableServices: value ? [parseInt(value)] : []});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: initialData?.id || Date.now(),
            isActive: initialData?.isActive ?? true,
            percentage: parseInt(String(formData.percentage)) || 0
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <MaterialInput id="code" name="code" label="کد تخفیف" value={formData.code} onChange={handleChange} required />
            <MaterialInput id="percentage" name="percentage" label="درصد تخفیف" type="number" value={formData.percentage} onChange={handleChange} required />
            <MaterialInput id="description" name="description" label="توضیحات" value={formData.description} onChange={handleChange} required />
            <MaterialSelect id="applicableServices" name="applicableServices" label="برای کدام خدمت؟" value={formData.applicableServices[0]?.toString() || ''} onChange={handleServiceChange}>
                <option value="">همه خدمات</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </MaterialSelect>
             <div className="grid grid-cols-2 gap-4">
                <MaterialInput id="validFrom" name="validFrom" label="تاریخ شروع" value={formData.validFrom} onChange={handleChange} required placeholder="مثلا ۱۴۰۳/۰۵/۰۱" />
                <MaterialInput id="validTo" name="validTo" label="تاریخ پایان" value={formData.validTo} onChange={handleChange} required placeholder="مثلا ۱۴۰۳/۰۶/۰۱" />
            </div>
             <div className="flex gap-2 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-12 bg-gray-200 text-gray-800 font-bold rounded-md">لغو</button>
                <button type="submit" className="flex-1 h-12 bg-success-500 text-white font-bold rounded-md">ذخیره تخفیف</button>
            </div>
        </form>
    );
};


const SendSmsSheet: React.FC<{ discount: Discount; customers: Customer[]; onClose: () => void; onSendSms: (phoneNumbers: string[]) => Promise<void> }> = ({ discount, customers, onClose, onSendSms }) => {
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [isSending, setIsSending] = useState(false);
    const message = `مشتری گرامی! کد تخفیف ${discount.percentage}% برای شما: ${discount.code}`;

    const handleToggleCustomer = (id: number) => {
        setSelectedCustomers(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleSendSms = async () => {
        if (selectedCustomers.length === 0) {
            window.showToast("لطفا حداقل یک مشتری را انتخاب کنید.", "error");
            return;
        }
        const phoneNumbers = customers.filter(c => selectedCustomers.includes(c.id)).map(c => c.phone);
        setIsSending(true);
        try {
            await onSendSms(phoneNumbers);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface-2 p-3 rounded-lg">
                <p className="text-sm font-semibold">متن پیامک:</p>
                <p className="text-sm text-gray-700">{message}</p>
            </div>
            <div>
                <p className="font-semibold mb-2">ارسال به:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customers.map(customer => (
                        <label key={customer.id} htmlFor={`customer-${customer.id}`} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg cursor-pointer">
                            <input 
                                type="checkbox" 
                                id={`customer-${customer.id}`}
                                checked={selectedCustomers.includes(customer.id)}
                                onChange={() => handleToggleCustomer(customer.id)}
                                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            <button type="button" onClick={handleSendSms} disabled={isSending || selectedCustomers.length === 0} className="w-full h-12 bg-primary-600 text-white font-bold rounded-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                <Send size={18} /> {isSending ? 'در حال ارسال...' : `ارسال به ${selectedCustomers.length} نفر`}
            </button>
        </div>
    )
}


const ProfileLink: React.FC<{ icon: React.ElementType, text: string, onClick: () => void, color?: string, iconRight?: React.ElementType, disabled?: boolean }> = ({ icon: Icon, text, onClick, color = 'text-gray-800', iconRight: IconRight, disabled = false }) => (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={`w-full flex items-center justify-between text-right p-3 rounded-md transition duration-200 ${color} ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}>
        <div className="flex items-center gap-4">
            <Icon size={22} className={color !== 'text-gray-800' ? '' : 'text-gray-600'} />
            <span className="font-semibold">{text}</span>
        </div>
        {IconRight ? <IconRight size={20} className="text-gray-400" /> : <ChevronLeft size={20} className="text-gray-400" />}
    </button>
);


const ToggleSwitch: React.FC<{ enabled: boolean, setEnabled: (e: boolean) => void, id: string, "aria-describedby"?: string }> = ({ enabled, setEnabled, id, "aria-describedby": ariaDescribedBy }) => (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" id={id} aria-describedby={ariaDescribedBy} />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
);

export default ProfileScreen;