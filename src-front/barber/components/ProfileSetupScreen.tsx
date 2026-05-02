

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Clock, Building, Scissors, ArrowRight, Info, Plus, Edit, Trash2, ImagePlus, Save, X, CheckCircle, MapPin, UserPlus, Users, Copy, Loader2 } from 'lucide-react';
import MaterialInput from './MaterialInput';
import MaterialSelect from './MaterialSelect';
import BottomSheet from './BottomSheet';
import { TimeRangePicker } from './TimeRangePicker';
import ConfirmationDialog from './ConfirmationDialog';
import { MapLocationPicker } from './MapLocationPicker';
import { MapirMapSelector } from './MapirMapSelector';
import { api } from '../utils/api';
import type { BarbershopInvitationItem, BarbershopMemberItem } from '../types/api';

interface ProfileSetupProps {
    onSetupComplete: () => void;
}

// --- DATA STRUCTURES ---
interface Service {
    id: number;
    name: string;
    price: string;
    duration: string;
    description: string;
    photo?: string;
    photoFile?: File;
}

interface ScheduleDay {
    key: string;
    name: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

interface ProfileFormData {
    /** Barber's (owner's) full name */
    barberName: string;
    /** Barbershop/salon name */
    name: string;
    address: string;
    about: string;
    services: Service[];
    schedule: ScheduleDay[];
    /** Minimum minutes before appointment start that booking is allowed */
    minAdvanceMinutes: number;
    /**
     * Gender of the salon: male (مردانه), female (زنانه) or unisex (مختلط).
     * This determines whether the barber shop caters to men, women or both.
     */
    gender: 'male' | 'female' | 'unisex';
    profileImage?: string;
    profileImageFile?: File;
    latitude?: number;
    longitude?: number;
}

// --- INITIAL STATE ---
const initialSchedule: ScheduleDay[] = [
    { key: 'saturday', name: 'شنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'sunday', name: 'یکشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'monday', name: 'دوشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'tuesday', name: 'سه‌شنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'wednesday', name: 'چهارشنبه', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'thursday', name: 'پنج‌شنبه', isActive: true, startTime: '10:00', endTime: '16:00' },
    { key: 'friday', name: 'جمعه', isActive: false, startTime: '09:00', endTime: '18:00' },
];

const initialFormData: ProfileFormData = {
    barberName: '',
    name: '',
    address: '',
    about: '',
    services: [],
    schedule: initialSchedule,
    gender: 'male',
    minAdvanceMinutes: 60,
};

const TOTAL_STEPS = 6;
const ONBOARDING_STEP_KEY = 'barber_onboarding_step';
const ONBOARDING_FORM_DATA_KEY = 'barber_onboarding_form_data';

function getSavedStep(): number {
    try {
        const s = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) ?? '1', 10);
        const n = Number.isNaN(s) ? 1 : s;
        return Math.max(1, Math.min(TOTAL_STEPS, n));
    } catch {
        return 1;
    }
}

/** Serializable slice of ProfileFormData (no File). */
function formDataToStored(data: ProfileFormData): string {
    const stored = {
        barberName: data?.barberName ?? '',
        name: data?.name ?? '',
        address: data?.address ?? '',
        about: data?.about ?? '',
        gender: data?.gender ?? 'male',
        latitude: data?.latitude,
        longitude: data?.longitude,
        minAdvanceMinutes: typeof data?.minAdvanceMinutes === 'number' ? data.minAdvanceMinutes : 60,
        schedule: data?.schedule ?? initialSchedule,
        services: (data?.services ?? []).map(({ id, name, price, duration, description, photo }) => ({ id, name, price, duration, description, photo })),
    };
    return JSON.stringify(stored);
}

function getSavedFormData(): ProfileFormData {
    try {
        const raw = localStorage.getItem(ONBOARDING_FORM_DATA_KEY);
        if (!raw) return initialFormData;
        const parsed = JSON.parse(raw) as Partial<ProfileFormData>;
        return {
            ...initialFormData,
            barberName: parsed.barberName ?? initialFormData.barberName,
            name: parsed.name ?? initialFormData.name,
            address: parsed.address ?? initialFormData.address,
            about: parsed.about ?? initialFormData.about,
            gender: parsed.gender ?? initialFormData.gender,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            minAdvanceMinutes: typeof (parsed as any).minAdvanceMinutes === 'number' ? (parsed as any).minAdvanceMinutes : initialFormData.minAdvanceMinutes,
            schedule: Array.isArray(parsed.schedule) && parsed.schedule.length ? parsed.schedule : initialFormData.schedule,
            services: Array.isArray(parsed.services) ? parsed.services : initialFormData.services,
        };
    } catch {
        return initialFormData;
    }
}

// --- MAIN COMPONENT ---
const WEEKDAY_BY_KEY: Record<string, number> = {
    saturday: 6, sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5,
};

const ProfileSetupScreen: React.FC<ProfileSetupProps> = ({ onSetupComplete }) => {
    const [step, setStep] = useState(getSavedStep);
    const [formData, setFormData] = useState<ProfileFormData>(getSavedFormData);
    const formDataRef = useRef<ProfileFormData>(formData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        if (step >= 1 && step <= TOTAL_STEPS) {
            localStorage.setItem(ONBOARDING_STEP_KEY, String(step));
        }
    }, [step]);

    const updateFormData = (data: Partial<ProfileFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const saveFormDataToStorage = (data: ProfileFormData) => {
        try {
            localStorage.setItem(ONBOARDING_FORM_DATA_KEY, formDataToStored(data));
        } catch {
            // ignore
        }
    };
    
    const handleNext = async () => {
        if (step === 5) {
            await handleSubmit();
        } else if (step === TOTAL_STEPS) {
            try {
                localStorage.removeItem(ONBOARDING_STEP_KEY);
                localStorage.removeItem(ONBOARDING_FORM_DATA_KEY);
            } catch { }
            onSetupComplete();
        } else {
            saveFormDataToStorage(formData);
            setStep(s => Math.min(s + 1, TOTAL_STEPS + 1));
        }
    };
    const handleBack = () => {
        saveFormDataToStorage(formData);
        setStep(s => Math.max(s - 1, 1));
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        setIsSubmitting(true);

        const fd = formDataRef.current ?? initialFormData;

        try {
            if (!(fd.name ?? '').trim()) {
                const error = 'نام سالن الزامی است';
                setSubmitError(error);
                window.showToast?.(error, 'error');
                setIsSubmitting(false);
                return;
            }
            if (!(fd.address ?? '').trim()) {
                const error = 'آدرس الزامی است';
                setSubmitError(error);
                window.showToast?.(error, 'error');
                setIsSubmitting(false);
                return;
            }
            if ((fd.services ?? []).length === 0) {
                const error = 'حداقل یک خدمت باید اضافه شود';
                setSubmitError(error);
                window.showToast?.(error, 'error');
                setIsSubmitting(false);
                return;
            }

            const profileImageFile = fd.profileImageFile;
            if (profileImageFile) {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(profileImageFile.type)) {
                    const error = 'فقط فایل‌های JPG، PNG و WebP پشتیبانی می‌شوند';
                    setSubmitError(error);
                    window.showToast?.(error, 'error');
                    setIsSubmitting(false);
                    return;
                }
                const maxSize = 5 * 1024 * 1024;
                if (profileImageFile.size > maxSize) {
                    const error = 'حجم فایل نباید بیشتر از ۵ مگابایت باشد';
                    setSubmitError(error);
                    window.showToast?.(error, 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            const submitFormData = new FormData();
            submitFormData.append('name', (fd.name ?? '').trim());
            if ((fd.barberName ?? '').trim()) submitFormData.append('fullName', (fd.barberName ?? '').trim());
            submitFormData.append('gender', fd.gender ?? 'male');
            submitFormData.append('address', (fd.address ?? '').trim());
            if ((fd.about ?? '').trim()) {
                submitFormData.append('description', (fd.about ?? '').trim());
            }
            if (fd.latitude != null) submitFormData.append('latitude', String(fd.latitude));
            if (fd.longitude != null) submitFormData.append('longitude', String(fd.longitude));
            if (fd.profileImageFile) {
                submitFormData.append('profileImage', fd.profileImageFile);
            }

            const result = await api.upload<{ success: boolean; message?: string; data?: any }>('/barber/profile', submitFormData);

            if (!result.success) {
                throw new Error(result.message || 'خطا در ایجاد پروفایل');
            }

            const schedules = (fd.schedule ?? initialSchedule).map((day) => ({
                weekday: WEEKDAY_BY_KEY[day.key] ?? 0,
                openTime: day.startTime,
                closeTime: day.endTime,
                isClosed: !day.isActive,
            }));
            await api.post<{ success: boolean }>('/barber/working-hours', { schedules });

            // Persist reservation policy (delay / min-advance) for this barbershop
            try {
                const minAdvance = Math.max(0, Math.round((fd as any).minAdvanceMinutes ?? 60));
                await api.put<{ success: boolean }>('/barber/reservation-policies/barbershop', {
                    minAdvanceMinutes: minAdvance,
                });
            } catch (e) {
                console.warn('Failed to save reservation policy during onboarding:', e);
            }

            for (const svc of fd.services ?? []) {
                const svcForm = new FormData();
                svcForm.append('name', (svc.name ?? '').trim());
                svcForm.append('price', String(svc.price ?? '0'));
                svcForm.append('estimatedTime', String(Math.max(1, parseInt(String(svc.duration), 10) || 30)));
                svcForm.append('description', (svc.description ?? '').trim());
                svcForm.append('gender', 'other');
                if (svc.photoFile) {
                    svcForm.append('avatar', svc.photoFile);
                }
                await api.upload<{ success: boolean }>('/barber/services', svcForm);
            }

            try {
                localStorage.removeItem(ONBOARDING_STEP_KEY);
                localStorage.removeItem(ONBOARDING_FORM_DATA_KEY);
            } catch { }
            window.showToast?.('پروفایل شما با موفقیت ایجاد شد!', 'success');
            setTimeout(() => setStep(6), 500);
        } catch (error: any) {
            console.error('Error submitting profile:', error);
            const errorMessage = error.message || 'خطا در برقراری ارتباط با سرور';
            setSubmitError(errorMessage);
            
            // Handle specific error cases
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                window.showToast?.('جلسه شما منقضی شده است. لطفاً مجدداً وارد شوید', 'error');
                // Could redirect to login here if needed
            } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                window.showToast?.('شما دسترسی به این بخش را ندارید', 'error');
            } else {
                window.showToast?.(errorMessage, 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isNextDisabled = useMemo(() => {
        switch (step) {
            case 1: return (formData?.name ?? '').trim() === '';
            case 2: return (formData?.address ?? '').trim() === '';
            case 4: return (formData?.services ?? []).length === 0;
            default: return false;
        }
    }, [step, formData]);
    
    const renderStepContent = () => {
        switch (step) {
            case 1: return <Step1Name data={formData} onUpdate={updateFormData} />;
            case 2: return <Step2Location data={formData} onUpdate={updateFormData} />;
            case 3: return <Step3About data={formData} onUpdate={updateFormData} />;
            case 4: return <Step4Services data={formData} onUpdate={updateFormData} />;
            case 5: return <Step5Hours data={formData} onUpdate={updateFormData} />;
            case 6: return <Step6Seats onComplete={onSetupComplete} />;
            default: return null;
        }
    };

    const stepInfo: { [key: number]: { title: string, icon: React.ElementType } } = {
        1: { title: 'اطلاعات اولیه', icon: Building },
        2: { title: 'آدرس و موقعیت', icon: MapPin },
        3: { title: 'درباره سالن', icon: Info },
        4: { title: 'خدمات و قیمت‌گذاری', icon: Scissors },
        5: { title: 'ساعات کاری', icon: Clock },
        6: { title: 'تیم و صندلی‌ها', icon: UserPlus },
    };
    
    if (step > TOTAL_STEPS) {
        return <StepSuccess onComplete={onSetupComplete} />;
    }

    return (
        <div className="flex flex-col h-screen bg-surface-1">
            <header className="sticky top-0 p-4 border-b border-gray-200 bg-white z-10">
                 <div className="flex items-center gap-4">
                    {step > 1 && <button onClick={handleBack} className="text-gray-600"><ArrowRight size={24} /></button>}
                    <div className="flex-grow">
                        <p className="text-sm text-gray-600">مرحله {step} از {TOTAL_STEPS}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col p-6 text-center overflow-y-auto">
                <div className="flex items-center gap-3 items-center justify-center">
                    <div className="inline-block bg-primary-100 p-3 rounded-full self-center">
                        {React.createElement(stepInfo[step].icon, { className: "w-8 h-8 text-primary-600" })}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{stepInfo[step].title}</h1>
                </div>

                <div className="mt-3 text-right flex-grow">
                    {renderStepContent()}
                </div>
            </main>

            <footer className="sticky bottom-0 p-4 border-t border-gray-200 bg-white z-10">
                {submitError && (
                    <div className="mb-2 p-2 bg-error-50 border border-error-200 rounded-md text-error-700 text-sm text-center">
                        {submitError}
                    </div>
                )}
                <button 
                    onClick={handleNext} 
                    disabled={(step !== TOTAL_STEPS && isNextDisabled) || (step === 5 && isSubmitting)} 
                    className="w-full h-12 bg-primary-600 text-white font-bold rounded-md transition hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {step === 5 && isSubmitting ? 'در حال ذخیره...' : step === 5 ? 'ادامه و ذخیره پروفایل' : step === TOTAL_STEPS ? 'پایان و ورود به پنل' : 'ادامه'}
                </button>
            </footer>
        </div>
    );
};


// --- STEP COMPONENTS ---
const Step1Name: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            window.showToast?.('فقط فایل‌های JPG، PNG و WebP پشتیبانی می‌شوند', 'error');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            window.showToast?.('حجم فایل نباید بیشتر از ۵ مگابایت باشد', 'error');
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        onUpdate({ 
            profileImage: previewUrl,
            profileImageFile: file 
        });
    };

    return (
        <div className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center mb-4">
                <div
                    className="relative w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-300"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {data.profileImage ? (
                        <img 
                            src={data.profileImage} 
                            alt="پروفایل" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImagePlus className="w-12 h-12 text-gray-500" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-primary-600 font-semibold"
                >
                    انتخاب تصویر پروفایل
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">JPG، PNG، WebP - حداکثر ۵MB</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                />
            </div>

            <MaterialInput id="barberName" label="نام شما (آرایشگر)" value={data?.barberName ?? ''} onChange={e => onUpdate({ barberName: e.target.value })} placeholder="نام و نام خانوادگی" />
            <MaterialInput id="salonName" label="نام سالن/آرایشگاه" value={data?.name ?? ''} onChange={e => onUpdate({ name: e.target.value })} />
            {/* Salon gender selection */}
            <MaterialSelect
                id="salonGender"
                label="نوع سالن"
                value={data?.gender ?? 'male'}
                onChange={e => onUpdate({ gender: e.target.value as 'male' | 'female' | 'unisex' })}
            >
                <option value="male">مردانه</option>
                <option value="female">زنانه</option>
                <option value="unisex">مختلط</option>
            </MaterialSelect>
        </div>
    );
};

const Step2Location: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    const [mapCenterKey, setMapCenterKey] = useState(0);
    return (
        <div className="space-y-4 flex flex-col gap-1">
            <p className="text-gray-600 mt-1 text-center">آدرس را جستجو و سپس آدرس دقیق را از نقشه انتخاب کنید.</p>
            <label className="block text-sm font-medium text-gray-700">آدرس شما:</label>
            <MapLocationPicker
                value={data?.address ?? ''}
                onChange={(address, lat, lon) => onUpdate({ address, latitude: lat, longitude: lon })}
                onMoveMapTo={() => setMapCenterKey((k) => k + 1)}
                label=""
                placeholder="جستجو یا وارد کردن آدرس..."
                showMapSheet={false}
            />
            <input type="hidden" id="location_latitude" name="latitude" value={data?.latitude ?? ''} />
            <input type="hidden" id="location_longitude" name="longitude" value={data?.longitude ?? ''} />
            <MapirMapSelector
                selectedLat={data?.latitude}
                selectedLon={data?.longitude}
                centerKey={mapCenterKey}
                onSelect={(result) => onUpdate({
                    address: result.address,
                    latitude: result.latitude,
                    longitude: result.longitude,
                })}
                height={380}
            />
        </div>
    );
};


const Step3About: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => (
     <div className="space-y-4">
        <p className="text-gray-600 mt-1 text-center">به مشتریان بگویید چرا باید شما را انتخاب کنند. از تخصص‌ها و ویژگی‌های منحصر به فرد سالن خود بنویسید.</p>
        <MaterialInput id="salonAbout" label="درباره سالن" multiline value={data?.about ?? ''} onChange={e => onUpdate({ about: e.target.value })} />
    </div>
);

const Step4Services: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    const [selectedService, setSelectedService] = useState<Service | 'new' | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

    const handleSaveService = (service: Service) => {
        let updatedServices;
        if (selectedService !== 'new' && selectedService?.id) {
            updatedServices = (data?.services ?? []).map(s => s.id === service.id ? service : s);
            window.showToast?.('خدمت ویرایش شد.', 'success');
        } else {
            updatedServices = [...(data?.services ?? []), { ...service, id: Date.now() }];
            window.showToast?.('خدمت جدید اضافه شد.', 'success');
        }
        onUpdate({ services: updatedServices });
        setSelectedService(null);
    };

    const handleDeleteService = () => {
        if (serviceToDelete === null) return;
        const updatedServices = (data?.services ?? []).filter(s => s.id !== serviceToDelete);
        onUpdate({ services: updatedServices });
        window.showToast?.('خدمت حذف شد.', 'info');
        setServiceToDelete(null);
    };

    return (
        <>
            <p className="text-gray-600 mt-1 text-center mb-4">حداقل یک خدمت را اضافه کنید. می‌توانید بعدا خدمات بیشتری اضافه کنید.</p>
            <div className="space-y-3">
                {(data?.services ?? []).map(service => (
                    <div key={service.id} className="bg-white p-3 rounded-lg flex justify-between items-center border shadow-xs">
                        <div className="flex items-center gap-3">
                            <img src={service.photo || 'https://picsum.photos/seed/placeholder/100'} alt={service.name} className="w-12 h-12 rounded-md object-cover bg-gray-200" />
                            <div>
                                <p className="font-bold">{service.name}</p>
                                <p className="text-sm text-gray-700">{parseInt(service.price).toLocaleString('fa-IR')} تومان - {service.duration} دقیقه</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedService(service)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"><Edit size={16}/></button>
                            <button onClick={() => setServiceToDelete(service.id)} className="p-2 text-error-600 hover:bg-error-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
                <button onClick={() => setSelectedService('new')} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition mt-4">
                    <Plus size={18}/>
                    <span>افزودن خدمت جدید</span>
                </button>
            </div>
            
            {(selectedService) && (
                <AddEditServiceSheet 
                    isOpen={selectedService !== null}
                    service={selectedService === 'new' ? null : selectedService}
                    onSave={handleSaveService} 
                    onClose={() => setSelectedService(null)} 
                />
            )}
            
            <ConfirmationDialog 
                isOpen={serviceToDelete !== null} 
                onClose={() => setServiceToDelete(null)} 
                onConfirm={handleDeleteService}
                title="حذف خدمت" isDestructive
            >
                <p>آیا از حذف این خدمت اطمینان دارید؟</p>
            </ConfirmationDialog>
        </>
    );
};

const Step5Hours: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    
    const schedule = data?.schedule ?? [];
    const handleToggle = (key: string) => {
        const newSchedule = schedule.map(d => d.key === key ? { ...d, isActive: !d.isActive } : d);
        onUpdate({ schedule: newSchedule });
    };

    const handleTimeChange = (key: string, field: 'startTime' | 'endTime', value: string) => {
        const newSchedule = schedule.map(d => d.key === key ? { ...d, [field]: value } : d);
        onUpdate({ schedule: newSchedule });
    };
    const handleTimeRangeChange = (key: string, startTime: string, endTime: string) => {
        const newSchedule = schedule.map(d => d.key === key ? { ...d, startTime, endTime } : d);
        onUpdate({ schedule: newSchedule });
    };

    return (
         <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4 shadow-xs">
                <h3 className="font-semibold text-gray-800 mb-2">قانون رزرو (تاخیر قابل انتخاب)</h3>
                <p className="text-xs text-gray-500 mb-3">
                    مشخص کنید مشتری حداقل چند دقیقه قبل از زمان مراجعه بتواند رزرو انجام دهد (مثلاً ۶۰ یعنی امروز تا یک ساعت آینده قابل رزرو نیست).
                </p>
                <MaterialInput
                    id="minAdvanceMinutes"
                    label="حداقل زمان قبل از مراجعه (دقیقه)"
                    type="number"
                    value={String((data as any).minAdvanceMinutes ?? 60)}
                    onChange={(e) => {
                        const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                        onUpdate({ minAdvanceMinutes: v } as any);
                    }}
                    inputMode="numeric"
                />
            </div>
            <p className="text-gray-600 mt-1 text-center mb-4">روزها و ساعات کاری خود را تنظیم کنید. می‌توانید بعدا این تنظیمات را تغییر دهید.</p>
            {schedule.map(day => (
                <div key={day.key} className={`p-4 rounded-lg transition ${day.isActive ? 'bg-white border shadow-xs' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg text-brand-black">{day.name}</span>
                        <ToggleSwitch enabled={day.isActive} setEnabled={() => handleToggle(day.key)} id={`toggle-${day.key}`} />
                    </div>
                    {day.isActive && (
                        <div className="mt-3">
                            <TimeRangePicker
                                id={`${day.key}-time`}
                                startTime={day.startTime}
                                endTime={day.endTime}
                                onChange={(start, end) => handleTimeRangeChange(day.key, start, end)}
                                labelStart="ساعت شروع"
                                labelEnd="ساعت پایان"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const Step6Seats: React.FC<{ onComplete: () => void }> = () => {
    const [inviteePhone, setInviteePhone] = useState('');
    const [sending, setSending] = useState(false);
    const [invitations, setInvitations] = useState<BarbershopInvitationItem[]>([]);
    const [members, setMembers] = useState<BarbershopMemberItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLists = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, memRes] = await Promise.all([
                api.get<{ success: boolean; invitations?: BarbershopInvitationItem[] }>('/barber/barbershop/invitations'),
                api.get<{ success: boolean; members?: BarbershopMemberItem[] }>('/barber/barbershop/members'),
            ]);
            if (invRes.success && invRes.invitations != null) setInvitations(invRes.invitations);
            if (memRes.success && memRes.members != null) setMembers(memRes.members);
        } catch {
            setInvitations([]);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const phone = inviteePhone.trim().replace(/\s/g, '');
        if (!phone) return;
        setSending(true);
        try {
            const res = await api.post<{ success: boolean; message?: string }>('/barber/barbershop/invitations', { inviteePhone: phone });
            if (res.success) {
                window.showToast?.(res.message || 'دعوتنامه ایجاد شد', 'success');
                setInviteePhone('');
                fetchLists();
            } else {
                window.showToast?.(res.message || 'خطا در ایجاد دعوتنامه', 'error');
            }
        } catch (err: unknown) {
            window.showToast?.(err instanceof Error ? err.message : 'خطا در ارسال دعوت', 'error');
        } finally {
            setSending(false);
        }
    };

    const copyInviteLink = (token: string) => {
        const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
        const link = `${base}?invite=${token}`;
        navigator.clipboard.writeText(link).then(() => {
            window.showToast?.('لینک دعوت کپی شد', 'success');
        }).catch(() => {
            window.showToast?.('کپی لینک انجام نشد', 'error');
        });
    };

    const pendingInvitations = invitations.filter((i) => i.status === 'pending' && i.expiresAt > Date.now());

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5 text-right">
            <p className="text-gray-600 text-sm">
                با افزودن صندلی (آرایشگر) ظرفیت روزانه سالن خود را مشخص کنید. هر آرایشگر در بازه ساعات کاری سالن شما فعالیت می‌کند.
            </p>
            <section className="space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <UserPlus size={18} />
                    افزودن صندلی (دعوت به پنل)
                </h3>
                <form onSubmit={handleInvite} className="space-y-2">
                    <MaterialInput
                        id="inviteePhone"
                        label="شماره تلفن دعوت‌شونده"
                        type="tel"
                        value={inviteePhone}
                        onChange={(e) => setInviteePhone(e.target.value)}
                        placeholder="09xxxxxxxxx"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full h-11 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : null}
                        ارسال دعوتنامه
                    </button>
                </form>
                <p className="text-xs text-gray-500">
                    لینک دعوت را برای شخص به اشتراک بگذارید تا در اپ وارد شود و دعوت را بپذیرد.
                </p>
            </section>
            {pendingInvitations.length > 0 && (
                <section>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                        <Users size={18} />
                        دعوتنامه‌های در انتظار
                    </h3>
                    <ul className="space-y-2">
                        {pendingInvitations.map((inv) => (
                            <li key={inv.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
                                <div>
                                    <p className="font-medium text-gray-800">{inv.inviteePhone}</p>
                                    <p className="text-xs text-gray-500">منقضی: {new Date(inv.expiresAt).toLocaleDateString('fa-IR')}</p>
                                </div>
                                <button type="button" onClick={() => copyInviteLink(inv.token)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-sm">
                                    <Copy size={16} /> لینک
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {members.length > 0 && (
                <section>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                        <Users size={18} />
                        اعضای سالن
                    </h3>
                    <ul className="space-y-2">
                        {members.map((m) => (
                            <li key={m.barberId} className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-800">
                                    {m.fullName || m.phone || `آرایشگر #${m.barberId}`}
                                    {m.isOwner && <span className="text-xs text-primary-600 mr-2">(مالک)</span>}
                                </p>
                                {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            <p className="text-xs text-gray-500 pt-2">می‌توانید بعداً از پروفایل نیز صندلی اضافه کنید.</p>
        </div>
    );
};

const StepSuccess: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-1 p-6">
        <div className="text-center">
            <div className="inline-block bg-success-100 p-4 rounded-full mb-4">
                <CheckCircle className="w-16 h-16 text-success-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">عالی بود!</h1>
            <p className="text-gray-700 mt-2 max-w-sm">پروفایل شما با موفقیت تکمیل شد. اکنون آماده مدیریت سالن خود و پذیرش رزروهای جدید هستید.</p>
            <button onClick={onComplete} className="w-full max-w-xs mt-8 h-12 bg-primary-600 text-white font-bold rounded-md transition hover:bg-primary-700">
                ورود به پنل مدیریت
            </button>
        </div>
    </div>
);


// --- HELPER COMPONENTS ---
const ToggleSwitch: React.FC<{ enabled: boolean, setEnabled: (e: boolean) => void, id: string }> = ({ enabled, setEnabled, id }) => (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" id={id} />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
);

const AddEditServiceSheet: React.FC<{ isOpen: boolean, service: Service | null, onSave: (s: Service) => void, onClose: () => void }> = ({ isOpen, service, onSave, onClose }) => {
    const [formData, setFormData] = useState<Service>(service || { id: 0, name: '', price: '0', duration: '30', description: '', photo: '' });
    const imageInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setFormData(service || { id: 0, name: '', price: '0', duration: '30', description: '', photo: '' });
    }, [service]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setFormData({ ...formData, photo: previewUrl, photoFile: file });
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
       <BottomSheet isOpen={isOpen} onClose={onClose} title={service ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                     <div className="w-24 h-24 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {formData.photo ? (
                            <img src={formData.photo} alt="نمونه کار" className="w-full h-full object-cover" />
                        ) : (
                            <ImagePlus className="text-gray-400" />
                        )}
                    </div>
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="font-semibold text-primary-600 text-sm">
                        انتخاب تصویر نمونه
                    </button>
                    <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <MaterialInput id="name" name="name" label="نام خدمت" type="text" value={formData.name} onChange={handleChange} required />
                <MaterialInput id="description" name="description" label="توضیحات کوتاه" value={formData.description || ''} onChange={handleChange} />

                <div className="grid grid-cols-2 gap-4">
                    <MaterialInput id="price" name="price" label="قیمت (تومان)" type="number" value={formData.price} onChange={handleChange} required inputMode="numeric" />
                    <MaterialInput id="duration" name="duration" label="مدت (دقیقه)" type="number" value={formData.duration} onChange={handleChange} inputMode="numeric" />
                </div>

                <div className="flex gap-2 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-200 text-gray-800 font-bold rounded-md flex items-center justify-center gap-1"><X size={18}/>لغو</button>
                    <button type="submit" className="flex-1 h-12 bg-success-500 text-white font-bold rounded-md flex items-center justify-center gap-1"><Save size={18}/>ذخیره</button>
                </div>
            </form>
       </BottomSheet>
    )
};


export default ProfileSetupScreen;