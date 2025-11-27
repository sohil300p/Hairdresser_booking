import React, { useState } from 'react';
import type { AppContextType } from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { AvatarUpload } from '../components/AvatarUpload';
import { api } from '../utils/api';

export const EditProfilePage: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { user, updateUser } = context;
    const [name, setName] = useState(user?.name || '');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileCompleted, setProfileCompleted] = useState(false);

    // Fetch current profile data on component mount
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const result = await api.get<{ success: boolean; data: { firstName: string; lastName: string; gender: 'male' | 'female'; avatar: string } }>('/profile');
                
                if (result.success && result.data) {
                    const { firstName, lastName, gender: userGender } = result.data;
                    
                    // Set existing data
                    if (firstName || lastName) {
                        const fullName = [firstName, lastName].filter(Boolean).join(' ');
                        setName(fullName);
                    }
                    
                    if (userGender) {
                        setGender(userGender);
                    }

                    // Check if profile is already completed
                    const isCompleted = !!(firstName || lastName) && !!userGender;
                    setProfileCompleted(isCompleted);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                context.showToast('خطا در بارگذاری پروفایل', 'error');
            }
        };

        fetchProfile();
    }, [context]);
    
    const handleSave = async () => {
        // Validate name
        if (!name.trim() || name.trim().length < 3) {
            setError('نام باید حداقل ۳ حرف باشد.');
            return;
        }
        
        // Validate gender (mandatory for profile completion)
        if (!gender) {
            setError('لطفاً جنسیت خود را انتخاب کنید.');
            return;
        }
        
        setError('');
        setLoading(true);
        
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                context.showToast('لطفاً دوباره وارد شوید', 'error');
                context.logout();
                return;
            }

            // Split name into firstName and lastName
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Send API request to update user profile
            const result = await api.put<{ success: boolean; message?: string }>('/profile', {
                firstName,
                lastName,
                gender,
            });

            if (result.success) {
                // Update local user state
                updateUser({ name: name.trim() });
                context.showToast('پروفایل شما با موفقیت تکمیل شد!', 'success');
                context.setCurrentPage('profile');
            } else {
                setError(result.message || 'خطا در به‌روزرسانی پروفایل');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Error updating profile:', error);
            setError(error.message || 'خطا در برقراری ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (newName.trim().length > 0 && newName.trim().length < 3) {
            setError('نام باید حداقل ۳ حرف باشد.');
        } else {
            setError('');
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--text-primary)]">ویرایش پروفایل</h1>
            </header>
            
            <div className="p-4 flex flex-col items-center flex-1">
                <AvatarUpload
                    currentAvatarUrl={user?.avatarUrl}
                    onUploadSuccess={(avatarUrl) => {
                        updateUser({ avatarUrl });
                        context.showToast('تصویر پروفایل با موفقیت به‌روزرسانی شد', 'success');
                    }}
                    onUploadError={(error) => {
                        context.showToast(error, 'error');
                    }}
                    disabled={profileCompleted}
                    size="lg"
                />
                
                <div className="w-full mt-8">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-right mb-1 w-full">نام و نام خانوادگی</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                            disabled={profileCompleted}
                            className={`form-input text-right ${profileCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    <p className="text-xs text-right mt-2 h-4" style={{ color: error ? 'var(--danger)' : 'var(--muted)'}}>
                        {error || 'نام کامل خود را وارد کنید.'}
                    </p>
                </div>
                
                <div className="w-full mt-4">
                    <label className="block text-sm font-medium text-gray-700 text-right mb-3">جنسیت</label>
                    <div className="flex gap-6 justify-center">
                        {/* Female Option */}
                        <button
                            type="button"
                            onClick={() => !profileCompleted && setGender('female')}
                            disabled={profileCompleted}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[60px] min-w-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
                                gender === 'female'
                                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-pink-300 hover:bg-pink-25'
                            } ${profileCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <Icon 
                                name="female" 
                                className={`w-10 h-10 mb-2`}
                                selected={gender === 'female'}
                                color={gender === 'female' ? 'pink' : undefined}
                            />
                            <span className="text-sm font-medium w-16">خانم</span>
                        </button>

                        {/* Male Option */}
                        <button
                            type="button"
                            onClick={() => !profileCompleted && setGender('male')}
                            disabled={profileCompleted}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[60px] min-w-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                gender === 'male'
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-25'
                            } ${profileCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <Icon 
                                name="male" 
                                className={`w-10 h-10 mb-2`}
                                selected={gender === 'male'}
                                color={gender === 'male' ? 'blue' : undefined}
                            />
                            <span className="text-sm font-medium w-16">آقا</span>
                        </button>
                    </div>
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
                
                <div className="w-full mt-auto mb-10">
                    {!profileCompleted && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-800 text-right">
                                ⚠️ توجه: پس از تکمیل پروفایل، امکان تغییر نام و جنسیت وجود نخواهد داشت.
                            </p>
                        </div>
                    )}
                    
                    {profileCompleted && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-red-800 text-right">
                                🚫 پروفایل شما تکمیل شده است. امکان تغییر نام و جنسیت وجود ندارد.
                            </p>
                        </div>
                    )}
                    
                    {!profileCompleted && (
                        <Button 
                            onClick={handleSave} 
                            disabled={!name.trim() || name.trim().length < 3 || !gender || loading}
                            variant="primary"
                            sticky={true}
                        >
                            {loading ? 'در حال ذخیره...' : 'تکمیل پروفایل'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};