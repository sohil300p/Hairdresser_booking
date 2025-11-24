import React, { useState } from 'react';
import type { UserContextType } from '../types';
import { Icon } from '../../shared/components/Icon';
import { Button } from '../../shared/components/Button';
import { profileService } from '../services/profile.service';

export const EditProfilePage: React.FC<{ context: UserContextType }> = ({ context }) => {
    const { user, updateUser } = context;
    const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(user?.avatarUrl || null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName.length < 3) {
            setError('نام باید حداقل ۳ حرف باشد.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await profileService.updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                profileImage: profileImage || undefined,
            });

            if (result.success && result.data) {
                const profileData = result.data;
                updateUser({
                    name: profileData.firstName && profileData.lastName
                        ? `${profileData.firstName} ${profileData.lastName}`
                        : profileData.firstName || profileData.lastName || profileData.phone,
                    avatarUrl: profileData.profileImage || undefined,
                });
                context.setCurrentPage('profile');
            } else {
                setError(result.message || 'خطا در به‌روزرسانی پروفایل');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'خطا در به‌روزرسانی پروفایل');
        } finally {
            setLoading(false);
        }
    };
    
    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setFirstName(newName);
        const fullName = `${newName} ${lastName}`.trim();
        if (fullName.length > 0 && fullName.length < 3) {
            setError('نام باید حداقل ۳ حرف باشد.');
        } else {
            setError('');
        }
    };

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setLastName(newName);
        const fullName = `${firstName} ${newName}`.trim();
        if (fullName.length > 0 && fullName.length < 3) {
            setError('نام باید حداقل ۳ حرف باشد.');
        } else {
            setError('');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--text-primary)]">ویرایش پروفایل</h1>
            </header>
            
            <div className="p-4 flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                        <img src={previewImage} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Icon name="user" className="w-12 h-12 text-gray-500" />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </label>
                </div>
                
                <div className="w-full mt-8">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 text-right mb-1">نام</label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={handleFirstNameChange}
                        className="form-input text-right"
                        disabled={loading}
                    />
                </div>

                <div className="w-full mt-4">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 text-right mb-1">نام خانوادگی</label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={handleLastNameChange}
                        className="form-input text-right"
                        disabled={loading}
                    />
                </div>
                
                <div className="w-full mt-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-right mb-1">شماره موبایل</label>
                    <input
                        type="tel"
                        id="phone"
                        value={user?.phone}
                        disabled
                        className="form-input text-left direction-ltr bg-gray-100"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 text-right w-full mt-2">{error}</p>
                )}
                
                <div className="w-full mt-8">
                    <Button onClick={handleSave} disabled={!!error || loading}>
                        {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
