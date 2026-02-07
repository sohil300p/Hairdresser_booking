

import React, { useState, useRef } from 'react';
import { ArrowRight, Camera, Save, XCircle as CancelIcon } from 'lucide-react';
import MaterialInput from './MaterialInput';
import MaterialSelect from './MaterialSelect';
import { MapLocationPicker } from './MapLocationPicker';
import { MapirMapSelector } from './MapirMapSelector';
import { api } from '../utils/api';

interface ProfileData {
    name: string;
    address: string;
    about: string;
    /**
     * Gender of the salon: male, female or unisex.
     */
    gender: 'male' | 'female' | 'unisex';
    latitude?: number;
    longitude?: number;
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
    
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('gender', profileData.gender);
            if (profileData.address) formData.append('address', profileData.address);
            if (profileData.about) formData.append('description', profileData.about);
            if (avatarFile) formData.append('profileImage', avatarFile);
            if (backgroundFile) formData.append('backgroundImage', backgroundFile);
            const res = await api.uploadPut<{ success: boolean }>('/barber/profile', formData);
            if (res.success) {
                onSave(profileData, avatarFile, backgroundFile);
            }
        } catch {
            window.showToast?.('خطا در ذخیره پروفایل', 'error');
        } finally {
            setIsSaving(false);
        }
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
                        <label className="block text-sm font-medium text-gray-700">آدرس</label>
                        <MapLocationPicker
                            value={profileData.address}
                            onChange={(address, lat, lon) => setProfileData({ ...profileData, address, latitude: lat, longitude: lon })}
                            label=""
                            placeholder="جستجو یا وارد کردن آدرس..."
                            showMapSheet={false}
                        />
                        <input type="hidden" id="location_latitude" name="latitude" value={profileData.latitude ?? ''} />
                        <input type="hidden" id="location_longitude" name="longitude" value={profileData.longitude ?? ''} />
                        <MapirMapSelector
                            selectedLat={profileData.latitude}
                            selectedLon={profileData.longitude}
                            onSelect={(result) => setProfileData({
                                ...profileData,
                                address: result.address,
                                latitude: result.latitude,
                                longitude: result.longitude,
                            })}
                            height={380}
                        />
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
                <button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 flex items-center justify-center gap-1 bg-success-500 text-white px-3 py-1.5 rounded-md font-semibold transition hover:bg-success-600 disabled:opacity-70 disabled:cursor-not-allowed">
                    <Save size={18} /> {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
            </footer>
        </div>
    );
};
export default EditProfileScreen;
