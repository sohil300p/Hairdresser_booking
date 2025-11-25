

import React, { useState, useRef, useMemo } from 'react';
import { Clock, Building, Scissors, ArrowRight, Info, Plus, Edit, Trash2, ImagePlus, Save, X, CheckCircle, MapPin } from 'lucide-react';
import MaterialInput from './MaterialInput';
import MaterialSelect from './MaterialSelect';
import BottomSheet from './BottomSheet';
import ConfirmationDialog from './ConfirmationDialog';

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
    name: string;
    address: string;
    about: string;
    services: Service[];
    schedule: ScheduleDay[];
    /**
     * Gender of the salon: male (مردانه), female (زنانه) or unisex (مختلط).
     * This determines whether the barber shop caters to men, women or both.
     */
    gender: 'male' | 'female' | 'unisex';
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
    name: '',
    address: '',
    about: '',
    services: [],
    schedule: initialSchedule,
    gender: 'male',
};

const TOTAL_STEPS = 5;

// --- MAIN COMPONENT ---
const ProfileSetupScreen: React.FC<ProfileSetupProps> = ({ onSetupComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ProfileFormData>(initialFormData);

    const updateFormData = (data: Partial<ProfileFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };
    
    const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS + 1));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    
    const isNextDisabled = useMemo(() => {
        switch (step) {
            case 1: return formData.name.trim() === '';
            case 2: return formData.address.trim() === '';
            case 4: return formData.services.length === 0;
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
            case 6: return <StepSuccess onComplete={onSetupComplete} />;
            default: return null;
        }
    };

    const stepInfo: { [key: number]: { title: string, icon: React.ElementType } } = {
        1: { title: 'نام سالن شما', icon: Building },
        2: { title: 'آدرس و موقعیت', icon: MapPin },
        3: { title: 'درباره سالن', icon: Info },
        4: { title: 'خدمات و قیمت‌گذاری', icon: Scissors },
        5: { title: 'ساعات کاری', icon: Clock },
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
                 <div className="inline-block bg-primary-100 p-3 rounded-full mb-3 self-center">
                    {React.createElement(stepInfo[step].icon, { className: "w-8 h-8 text-primary-600" })}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{stepInfo[step].title}</h1>
                <div className="mt-6 text-right flex-grow">
                    {renderStepContent()}
                </div>
            </main>

            <footer className="sticky bottom-0 p-4 border-t border-gray-200 bg-white z-10">
                <button onClick={handleNext} disabled={isNextDisabled} className="w-full h-12 bg-primary-600 text-white font-bold rounded-md transition hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {step === TOTAL_STEPS ? 'پایان و ذخیره' : 'ادامه'}
                </button>
            </footer>
        </div>
    );
};


// --- STEP COMPONENTS ---
const Step1Name: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => (
    <div className="space-y-6">
        <p className="text-gray-600 mt-1 text-center">لطفا نام تجاری سالن یا فروشگاه خود را وارد کنید.</p>
        <MaterialInput id="salonName" label="نام سالن" value={data.name} onChange={e => onUpdate({ name: e.target.value })} />
        {/* Salon gender selection */}
        <MaterialSelect
            id="salonGender"
            label="نوع سالن"
            value={data.gender}
            onChange={e => onUpdate({ gender: e.target.value as 'male' | 'female' | 'unisex' })}
        >
            <option value="male">مردانه</option>
            <option value="female">زنانه</option>
            <option value="unisex">مختلط</option>
        </MaterialSelect>
    </div>
);

const Step2Location: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    const [isMapSheetOpen, setMapSheetOpen] = useState(false);

    const handleConfirmLocation = () => {
        onUpdate({ address: "تهران، میدان آزادی، برج آزادی، طبقه اول" });
        setMapSheetOpen(false);
        window.showToast("آدرس از روی نقشه انتخاب شد.", "info");
    };

    return (
        <>
            <div className="space-y-4">
                <p className="text-gray-600 mt-1 text-center">آدرس خود را وارد کرده یا از روی نقشه انتخاب کنید.</p>
                <MaterialInput id="salonAddress" label="آدرس (خیابان، شهر)" multiline value={data.address} onChange={e => onUpdate({ address: e.target.value })} />
                <button 
                    onClick={() => setMapSheetOpen(true)}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition"
                >
                    <MapPin size={18} />
                    انتخاب از روی نقشه
                </button>
            </div>
            <BottomSheet isOpen={isMapSheetOpen} onClose={() => setMapSheetOpen(false)} title="موقعیت مکانی را انتخاب کنید">
                <div className="flex flex-col items-center space-y-4">
                     <div className="relative w-full h-64 bg-gray-300 rounded-lg overflow-hidden">
                        <img src="https://www.google.com/maps/d/u/0/thumbnail?mid=1_2S-58R31162bl_cf09e9A0&hl=en" alt="نقشه" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <MapPin className="w-10 h-10 text-error-500 drop-shadow-lg" />
                        </div>
                    </div>
                    <p className="text-sm text-center text-gray-600">مکان‌نما را روی موقعیت دقیق سالن خود قرار داده و دکمه تایید را بزنید.</p>
                    <button onClick={handleConfirmLocation} className="w-full h-12 bg-primary-600 text-white font-bold rounded-md">
                        تایید موقعیت مکانی
                    </button>
                </div>
            </BottomSheet>
        </>
    );
};


const Step3About: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => (
     <div className="space-y-4">
        <p className="text-gray-600 mt-1 text-center">به مشتریان بگویید چرا باید شما را انتخاب کنند. از تخصص‌ها و ویژگی‌های منحصر به فرد سالن خود بنویسید.</p>
        <MaterialInput id="salonAbout" label="درباره سالن" multiline value={data.about} onChange={e => onUpdate({ about: e.target.value })} />
    </div>
);

const Step4Services: React.FC<{ data: ProfileFormData, onUpdate: (d: Partial<ProfileFormData>) => void }> = ({ data, onUpdate }) => {
    const [selectedService, setSelectedService] = useState<Service | 'new' | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

    const handleSaveService = (service: Service) => {
        let updatedServices;
        if (selectedService !== 'new' && selectedService?.id) {
            updatedServices = data.services.map(s => s.id === service.id ? service : s);
            window.showToast('خدمت ویرایش شد.', 'success');
        } else {
            updatedServices = [...data.services, { ...service, id: Date.now() }];
            window.showToast('خدمت جدید اضافه شد.', 'success');
        }
        onUpdate({ services: updatedServices });
        setSelectedService(null);
    };

    const handleDeleteService = () => {
        if (serviceToDelete === null) return;
        const updatedServices = data.services.filter(s => s.id !== serviceToDelete);
        onUpdate({ services: updatedServices });
        window.showToast('خدمت حذف شد.', 'info');
        setServiceToDelete(null);
    };

    return (
        <>
            <p className="text-gray-600 mt-1 text-center mb-4">حداقل یک خدمت را اضافه کنید. می‌توانید بعدا خدمات بیشتری اضافه کنید.</p>
            <div className="space-y-3">
                {data.services.map(service => (
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
    
    const handleToggle = (key: string) => {
        const newSchedule = data.schedule.map(d => d.key === key ? { ...d, isActive: !d.isActive } : d);
        onUpdate({ schedule: newSchedule });
    };

    const handleTimeChange = (key: string, field: 'startTime' | 'endTime', value: string) => {
        const newSchedule = data.schedule.map(d => d.key === key ? { ...d, [field]: value } : d);
        onUpdate({ schedule: newSchedule });
    };

    return (
         <div className="space-y-3">
            <p className="text-gray-600 mt-1 text-center mb-4">روزها و ساعات کاری خود را تنظیم کنید. می‌توانید بعدا این تنظیمات را تغییر دهید.</p>
            {data.schedule.map(day => (
                <div key={day.key} className={`p-4 rounded-lg transition ${day.isActive ? 'bg-white border shadow-xs' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg text-brand-black">{day.name}</span>
                        <ToggleSwitch enabled={day.isActive} setEnabled={() => handleToggle(day.key)} id={`toggle-${day.key}`} />
                    </div>
                    {day.isActive && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <MaterialInput id={`${day.key}-start`} label="ساعت شروع" type="time" value={day.startTime} onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)} style={{ colorScheme: 'light' }} />
                            <MaterialInput id={`${day.key}-end`} label="ساعت پایان" type="time" value={day.endTime} onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)} style={{ colorScheme: 'light' }}/>
                        </div>
                    )}
                </div>
            ))}
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
    const [formData, setFormData] = useState<Service>(service || { id: 0, name: '', price: '0', duration: '0', description: '', photo: '' });
    const imageInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setFormData(service || { id: 0, name: '', price: '0', duration: '0', description: '', photo: '' });
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
                        انتخاب تصویر نمونه (الزامی)
                    </button>
                    <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" required={!formData.photo} />
                </div>

                <MaterialInput id="name" name="name" label="نام خدمت" type="text" value={formData.name} onChange={handleChange} required />
                <MaterialInput id="description" name="description" label="توضیحات کوتاه (الزامی)" value={formData.description || ''} onChange={handleChange} required />

                <div className="grid grid-cols-2 gap-4">
                    <MaterialInput id="price" name="price" label="قیمت (تومان)" type="number" value={formData.price} onChange={handleChange} required inputMode="numeric" />
                    <MaterialInput id="duration" name="duration" label="مدت (دقیقه)" type="number" value={formData.duration} onChange={handleChange} required inputMode="numeric" />
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