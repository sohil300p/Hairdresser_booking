
import React, {useState, useEffect, useRef} from 'react';
import { ChevronLeft, Edit, Plus, Trash2, CreditCard, Download, UserCog, Clock, Tag, Power, LogOut, Shield, HelpCircle, FileText, Star, Save, WifiOff, Eye, UserCheck, Percent, CalendarPlus, Banknote, History, Copy, Send, Accessibility, ImagePlus, MapPin, ArrowRight, User as UserIcon, Check, ArrowUpRight, Gift } from 'lucide-react';
import BottomSheet from './BottomSheet';
import ConfirmationDialog from './ConfirmationDialog';
import MaterialInput from './MaterialInput';
import EditProfileScreen from './EditProfileScreen';
import MaterialSelect from './MaterialSelect';
import EditScheduleScreen from './EditScheduleScreen';
import { Screen } from '../App';

// Sub-page components (moved here for organization)
import ServicesSubPage from './ServicesSubPage';
import TermsSubPage from './TermsSubPage';
// FIX: Added top-level imports for components that were previously loaded with require().
import CustomerReviewsScreen from './CustomerReviewsScreen';
import SupportScreen from './SupportScreen';


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

const customers: Customer[] = [
    { id: 1, name: 'احمد رضایی', phone: '09123456789', avatar: 'https://picsum.photos/id/1005/100/100'},
    { id: 2, name: 'حسن محمدی', phone: '09121112233', avatar: 'https://picsum.photos/id/1006/100/100'},
    { id: 3, name: 'علی اکبری', phone: '09355554433', avatar: 'https://picsum.photos/id/1008/100/100'},
];


const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, setIsSubPageActive, isLargeFont, setIsLargeFont, isHighContrast, setIsHighContrast, isVoiceAssistantEnabled, setIsVoiceAssistantEnabled, isAutoConfirmEnabled, setIsAutoConfirmEnabled, setActiveScreen }) => {
    type SheetName = 'wallet' | 'discounts' | 'accessibility' | 'sendSms' | 'bookingSettings';
    const [isSheetOpen, setSheetOpen] = useState<SheetName | null>(null);
    const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

    useEffect(() => {
        setIsSubPageActive(activeSubPage !== null);
    }, [activeSubPage, setIsSubPageActive]);

    // Include gender in profile data; default to 'female' for demonstration. Possible values: 'male', 'female', 'unisex'.
    const [profileData, setProfileData] = useState({ name: 'سالن زیبایی شما', address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳', about: 'ارائه دهنده جدیدترین خدمات آرایشی و پیرایشی با بیش از ۱۰ سال سابقه درخشان. ما در کات‌چی به زیبایی شما اهمیت می‌دهیم.', gender: 'female' as 'male' | 'female' | 'unisex' });
    const [avatar, setAvatar] = useState('https://picsum.photos/id/1027/100/100');
    const [background, setBackground] = useState('https://picsum.photos/seed/barbershop/600/400');
    
    const [schedule, setSchedule] = useState<Schedule[]>(initialSchedule);
    const [services, setServices] = useState<Service[]>(initialServices);
    const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
    
    // Wallet State
    const [bankCard, setBankCard] = useState({ number: '', name: '', shaba: '' });
    const [newCard, setNewCard] = useState({ number: '', name: '', shaba: '' });
    const [cardErrors, setCardErrors] = useState({ number: '', name: '', shaba: '' });
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [walletView, setWalletView] = useState<'main' | 'addCard' | 'history'>('main');

    // Discount State
    const [discountSheetView, setDiscountSheetView] = useState<'list' | 'form'>('list');
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [discountForSms, setDiscountForSms] = useState<Discount | null>(null);
    
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
    
    // Discount Management
    const handleSaveDiscount = (discountData: Discount) => {
        if (editingDiscount) {
            setDiscounts(discounts.map(d => d.id === discountData.id ? discountData : d));
            window.showToast('تخفیف با موفقیت ویرایش شد.', 'success');
        } else {
            setDiscounts([...discounts, discountData]);
            window.showToast('تخفیف جدید اضافه شد.', 'success');
        }
        setDiscountSheetView('list');
        setEditingDiscount(null);
    };

    const handleDeleteDiscount = (id: number) => {
        handleOpenDialog('حذف تخفیف', 'آیا از حذف این کد تخفیف اطمینان دارید؟', () => {
            setDiscounts(discounts.filter(d => d.id !== id));
            window.showToast('کد تخفیف حذف شد.', 'info');
        }, true);
    };

    const handleOpenSmsSheet = (discount: Discount) => {
        setDiscountForSms(discount);
        setSheetOpen('sendSms');
    }
    
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
            () => {
                window.showToast('درخواست برداشت شما ثبت شد.', 'success');
                setWithdrawalAmount('');
                setSheetOpen(null);
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
            onSave={(newSchedule) => {
                setSchedule(newSchedule);
                setActiveSubPage(null);
                window.showToast('ساعات کاری بروزرسانی شد.', 'success');
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
                        <ProfileLink icon={CalendarPlus} text="تنظیمات رزرو" onClick={() => setSheetOpen('bookingSettings')} iconRight={ArrowUpRight} />
                    </div>
                    <div className="bg-white rounded-lg border shadow-xs p-2 space-y-1">
                        <ProfileLink icon={CreditCard} text="کیف پول و درآمد" onClick={() => { setWalletView('main'); setSheetOpen('wallet'); }} iconRight={ArrowUpRight}/>
                        <ProfileLink icon={Gift} text="باشگاه مشتریان" onClick={() => setActiveScreen('club')} iconRight={ArrowRight} />
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
                </div>
            </BottomSheet>

            {/* Wallet Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'wallet'} onClose={() => setSheetOpen(null)} title="کیف پول و درآمد">
                {walletView === 'main' && (
                    <div className="space-y-4">
                        <div className="bg-primary-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-primary-800">موجودی قابل برداشت</p>
                            <p className="text-3xl font-bold text-primary-900 mt-1">۱,۲۵۰,۰۰۰ <span className="text-base font-normal">تومان</span></p>
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
                            <h3 className="font-bold">تاریخچه برداشت‌ها</h3>
                             {withdrawalHistory.map(item => (
                                <div key={item.id} className="bg-surface-1 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{item.amount.toLocaleString('fa-IR')} تومان</p>
                                        <p className="text-xs text-gray-600">{item.date}</p>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-success-100 text-success-700">موفق</span>
                                </div>
                            ))}
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
            
            {/* Send SMS Sheet */}
            <BottomSheet isOpen={isSheetOpen === 'sendSms'} onClose={() => setSheetOpen(null)} title={`ارسال کد ${discountForSms?.code}`}>
                {discountForSms && <SendSmsSheet discount={discountForSms} customers={customers} onClose={() => setSheetOpen(null)}/>}
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


const SendSmsSheet: React.FC<{discount: Discount, customers: Customer[], onClose: () => void}> = ({ discount, customers, onClose }) => {
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const message = `مشتری گرامی! کد تخفیف ${discount.percentage}% برای شما: ${discount.code}`;

    const handleToggleCustomer = (id: number) => {
        setSelectedCustomers(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleSendSms = () => {
        if (selectedCustomers.length === 0) {
            window.showToast("لطفا حداقل یک مشتری را انتخاب کنید.", "error");
            return;
        }
        window.showToast(`پیامک تخفیف برای ${selectedCustomers.length} مشتری ارسال شد.`, "success");
        onClose();
    }

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
            <button type="button" onClick={handleSendSms} className="w-full h-12 bg-primary-600 text-white font-bold rounded-md flex items-center justify-center gap-2">
                <Send size={18} /> ارسال به {selectedCustomers.length} نفر
            </button>
        </div>
    )
}


const ProfileLink: React.FC<{ icon: React.ElementType, text: string, onClick: () => void, color?: string, iconRight?: React.ElementType }> = ({ icon: Icon, text, onClick, color = 'text-gray-800', iconRight: IconRight }) => (
    <button type="button" onClick={onClick} className={`w-full flex items-center justify-between text-right p-3 rounded-md hover:bg-gray-100 transition duration-200 ${color}`}>
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