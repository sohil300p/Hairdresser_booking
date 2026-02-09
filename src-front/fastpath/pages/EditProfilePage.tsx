import React, { useState, useRef } from 'react';
import type { AppContextType } from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { AvatarUpload } from '../components/AvatarUpload';
import { api } from '../utils/api';

export const EditProfilePage: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { user, updateUser } = context;
    const [name, setName] = useState(user?.name || '');
    const [gender, setGender] = useState<'male' | 'female' | ''>(user?.gender || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Check if profile is already completed from user context
    const [profileCompleted, setProfileCompleted] = useState(!!(user?.name && user?.gender));
    const hasFetchedRef = useRef(false);

    // Fetch current profile data on component mount
    React.useEffect(() => {
        // Prevent multiple calls - only fetch once
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        let isMounted = true;

        const fetchProfile = async () => {

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const result = await api.get<{ 
                    success: boolean; 
                    data: { 
                        fullName?: string | null;
                        firstName?: string;
                        lastName?: string;
                        gender?: 'male' | 'female' | 'other' | null;
                        avatar?: string;
                        profileImage?: string;
                    } 
                }>('/profile');
                
                if (!isMounted) return; // Component unmounted, don't update state
                
                if (result.success && result.data) {
                    const { fullName, firstName, lastName, gender: userGender } = result.data;
                    
                    // Set existing data - handle both fullName (new) and firstName/lastName (old)
                    if (fullName) {
                        setName(fullName);
                    } else if (firstName || lastName) {
                        const nameFromParts = [firstName, lastName].filter(Boolean).join(' ');
                        if (nameFromParts) {
                            setName(nameFromParts);
                        }
                    }
                    
                    if (userGender && (userGender === 'male' || userGender === 'female')) {
                        setGender(userGender);
                    }

                    // Check if profile is already completed
                    const hasName = !!(fullName || firstName || lastName);
                    const isCompleted = hasName && !!userGender;
                    setProfileCompleted(isCompleted);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching profile:', error);
                // Only show error if component is still mounted
                if (isMounted) {
                    context.showToast('خطا در بارگذاری پروفایل', 'error');
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array - only run once on mount
    
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

            // Send API request to update user profile
            // Backend expects fullName (not firstName/lastName) and gender
            const result = await api.put<{ 
                success: boolean; 
                message?: string;
                data?: {
                    fullName: string | null;
                    gender?: 'male' | 'female' | 'other' | null;
                };
            }>('/profile', {
                fullName: name.trim(),
                gender,
            });

            if (result.success) {
                // Update local user state with data from server response
                const updatedName = result.data?.fullName || name.trim();
                const updatedGender = result.data?.gender || gender;
                
                // Update user state immediately and save to localStorage
                updateUser({ 
                    name: updatedName,
                    gender: updatedGender as 'male' | 'female'
                });
                
                // Force immediate localStorage update to ensure state is saved
                const currentUser = context.user;
                if (currentUser) {
                    const updatedUser = {
                        ...currentUser,
                        name: updatedName,
                        gender: updatedGender as 'male' | 'female'
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                
                // Mark profile as completed
                setProfileCompleted(true);
                
                context.showToast('پروفایل شما با موفقیت تکمیل شد!', 'success');
                // Navigate immediately - user state is now updated
                context.setCurrentPage('home');
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
                    onUploadSuccess={(profileImageUrl) => {
                        // Update user with new avatar URL - this will automatically save to localStorage
                        updateUser({ avatarUrl: profileImageUrl });
                        // Note: updateUser already shows a success toast, but we show a specific one for image upload
                        context.showToast('تصویر پروفایل با موفقیت به‌روزرسانی شد', 'success');
                    }}
                    onUploadError={(error) => {
                        context.showToast(error, 'error');
                    }}
                    disabled={false}
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
                    {profileCompleted && gender ? (
                        // Show selected gender as disabled/highlighted when profile is completed
                        <div className="flex gap-6 justify-center">
                            <div className={`flex flex-col items-center p-4 rounded-xl border-2 min-h-[60px] min-w-[80px] ${
                                gender === 'female'
                                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                                    : 'border-blue-500 bg-blue-50 text-blue-600'
                            } opacity-75`}>
                                <Icon 
                                    name={gender} 
                                    className="w-10 h-10 mb-2"
                                    selected={true}
                                    color={gender === 'female' ? 'pink' : 'blue'}
                                />
                                <span className="text-sm text-center font-medium w-16">
                                    {gender === 'female' ? 'خانم' : 'آقا'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        // Show gender selection buttons when profile is not completed
                        <div className="flex gap-6 justify-center">
                            {/* Female Option */}
                            <button
                                type="button"
                                onClick={() => setGender('female')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[60px] min-w-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
                                    gender === 'female'
                                        ? 'border-pink-500 bg-pink-50 text-pink-600'
                                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-pink-300 hover:bg-pink-25'
                                } cursor-pointer`}
                            >
                                <Icon 
                                    name="female" 
                                    className="w-10 h-10 mb-2"
                                    selected={gender === 'female'}
                                    color={gender === 'female' ? 'pink' : undefined}
                                />
                                <span className="text-sm text-center font-medium w-16">خانم</span>
                            </button>

                            {/* Male Option */}
                            <button
                                type="button"
                                onClick={() => setGender('male')}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[60px] min-w-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    gender === 'male'
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-25'
                                } cursor-pointer`}
                            >
                                <Icon 
                                    name="male" 
                                    className="w-10 h-10 mb-2"
                                    selected={gender === 'male'}
                                    color={gender === 'male' ? 'blue' : undefined}
                                />
                                <span className="text-sm text-center font-medium w-16">آقا</span>
                            </button>
                        </div>
                    )}
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
                
                {!profileCompleted && (
                    <div className="w-full mt-auto mb-10">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-800 text-right">
                                ⚠️ توجه: پس از تکمیل پروفایل، امکان تغییر نام و جنسیت وجود نخواهد داشت.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={handleSave} 
                            disabled={!name.trim() || name.trim().length < 3 || !gender || loading}
                            variant="primary"
                            sticky={true}
                        >
                            {loading ? 'در حال ذخیره...' : 'تکمیل پروفایل'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};