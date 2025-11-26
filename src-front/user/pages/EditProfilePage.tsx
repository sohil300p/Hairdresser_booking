import React, { useState } from 'react';
import type { AppContextType } from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';

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

                const response = await fetch('http://localhost:3000/api/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                
                if (data.success && data.data) {
                    const { firstName, lastName, gender: userGender } = data.data;
                    
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
            }
        };

        fetchProfile();
    }, []);
    
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
            // Get token from localStorage
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
            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    gender,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update local user state
                updateUser({ name: name.trim() });
                context.showToast('پروفایل شما با موفقیت تکمیل شد!', 'success');
                context.setCurrentPage('profile');
            } else {
                setError(data.message || 'خطا در به‌روزرسانی پروفایل');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('خطا در برقراری ارتباط با سرور');
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
        <div className="bg-gray-50 min-h-screen" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--text-primary)]">ویرایش پروفایل</h1>
            </header>
            
            <div className="p-4 flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Icon name="user" className="w-12 h-12 text-gray-500" />
                    )}
                    <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
                
                <div className="w-full mt-8">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-right mb-1">نام و نام خانوادگی</label>
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
                    <label className="block text-sm font-medium text-gray-700 text-right mb-2">جنسیت</label>
                    <div className="flex gap-4 justify-end">
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-2">خانم</span>
                            <input
                                type="radio"
                                name="gender"
                                checked={gender === 'female'}
                                onChange={() => setGender('female')}
                                disabled={profileCompleted}
                                className="ml-2"
                            />
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-2">آقا</span>
                            <input
                                type="radio"
                                name="gender"
                                checked={gender === 'male'}
                                onChange={() => setGender('male')}
                                disabled={profileCompleted}
                                className="ml-2"
                            />
                        </label>
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
                
                <div className="w-full mt-6">
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
                    
                    <Button 
                        onClick={handleSave} 
                        style={{ display: (profileCompleted || !name.trim() || name.trim().length < 3 || !gender || loading) ? 'block' : 'none' }}
                    >
                        {loading ? 'در حال ذخیره...' : profileCompleted ? 'پروفایل تکمیل شده' : 'تکمیل پروفایل'}
                    </Button>
                </div>
            </div>
        </div>
    );
};