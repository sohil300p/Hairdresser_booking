

import React, { useState, useRef } from 'react';
import { ArrowRight, Camera, Save, XCircle as CancelIcon, MapPin } from 'lucide-react';
import MaterialInput from './MaterialInput';
import MaterialSelect from './MaterialSelect';

interface ProfileData {
    name: string;
    address: string;
    about: string;
    /**
     * Gender of the salon: male, female or unisex.
     */
    gender: 'male' | 'female' | 'unisex';
}

interface EditProfileScreenProps {
    initialProfileData: ProfileData;
    initialAvatar: string;
    initialBackground: string;
    onSave: (newData: ProfileData, newAvatar?: File, newBackground?: File) => void;
    onBack: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ 
    initialProfileData, 
    initialAvatar, 
    initialBackground, 
    onSave, 
    onBack 
}) => {
    const [profileData, setProfileData] = useState(initialProfileData);
    const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
    const [backgroundPreview, setBackgroundPreview] = useState(initialBackground);
    const [avatarFile, setAvatarFile] = useState<File | undefined>();
    const [backgroundFile, setBackgroundFile] = useState<File | undefined>();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'avatar' | 'background') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            if (imageType === 'avatar') {
                setAvatarPreview(previewUrl);
                setAvatarFile(file);
            } else {
                setBackgroundPreview(previewUrl);
                setBackgroundFile(file);
            }
        }
    };
    
    const handleSave = () => {
        onSave(profileData, avatarFile, backgroundFile);
    };

    const handleSelectOnMap = () => {
        // In a real app, this would open a map interface.
        // Here, we simulate selecting an address and updating the input.
        const simulatedAddress = "تهران، میدان آزادی، برج آزادی";
        setProfileData({...profileData, address: simulatedAddress});
        window.showToast("آدرس از روی نقشه انتخاب شد.", "info");
    };

    return (
        <div className="absolute inset-0 bg-surface-1 z-50 flex flex-col">
             <header className="sticky top-0 bg-surface-1 p-4 z-50 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onBack} aria-label="بازگشت"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">ویرایش پروفایل</h1>
            </header>
            <div className="flex-grow overflow-y-auto">
                {/* Profile Header for editing */}
                <div className="relative h-48 bg-gray-200">
                    <img src={backgroundPreview} className="w-full h-full object-cover" alt="بکگراند" />
                    <button onClick={() => backgroundInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white flex-col gap-1">
                        <Camera size={24}/>
                        <span className="text-xs font-semibold">تغییر عکس</span>
                        <input type="file" accept="image/*" ref={backgroundInputRef} onChange={(e) => handleImageChange(e, 'background')} className="hidden" />
                    </button>
                    <div className="absolute -bottom-12 right-1/2 translate-x-1/2">
                        <div className="relative">
                            <img src={avatarPreview} alt="آواتار" className="w-24 h-24 rounded-full border-4 border-white shadow-md" />
                            <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                                <Camera size={20}/>
                                <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageChange(e, 'avatar')} className="hidden" />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="pt-20 px-4 space-y-6">
                    <MaterialInput 
                        id="profileName"
                        label="نام سالن"
                        type="text" 
                        value={profileData.name} 
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                    />
                    <div className="space-y-2">
                        <MaterialInput 
                            id="profileAddress"
                            label="آدرس"
                            type="text" 
                            value={profileData.address} 
                            onChange={e => setProfileData({...profileData, address: e.target.value})}
                        />
                        <button 
                            onClick={handleSelectOnMap}
                            className="text-sm font-semibold text-primary-600 flex items-center gap-1 px-1 py-1"
                        >
                            <MapPin size={16} />
                            انتخاب از روی نقشه
                        </button>
                    </div>
                    <MaterialInput 
                        id="profileAbout"
                        label="درباره ما"
                        multiline
                        value={profileData.about} 
                        onChange={e => setProfileData({...profileData, about: e.target.value})}
                    />
                    {/* Gender select */}
                    <MaterialSelect
                        id="profileGender"
                        label="نوع سالن"
                        value={profileData.gender}
                        onChange={e => setProfileData({ ...profileData, gender: e.target.value as 'male' | 'female' | 'unisex' })}
                    >
                        <option value="male">مردانه</option>
                        <option value="female">زنانه</option>
                        <option value="unisex">مختلط</option>
                    </MaterialSelect>
                </div>
            </div>
            <footer className="p-4 border-t border-gray-200 flex gap-2" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                <button onClick={onBack} className="flex-1 h-12 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md font-semibold transition hover:bg-gray-300">
                    <CancelIcon size={18} /> لغو
                </button>
                <button onClick={handleSave} className="flex-1 h-12 flex items-center justify-center gap-1 bg-success-500 text-white px-3 py-1.5 rounded-md font-semibold transition hover:bg-success-600">
                    <Save size={18} /> ذخیره تغییرات
                </button>
            </footer>
        </div>
    );
};
export default EditProfileScreen;
