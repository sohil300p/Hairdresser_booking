import React, { useState } from 'react';
import type { AppContextType, User } from '../types';

interface LoginPageProps {
    context: AppContextType;
}

export const LoginPage: React.FC<LoginPageProps> = ({ context }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:3000/api';

    const handleSendOtp = async () => {
        if (phone.length < 11) {
            context.showToast('شماره موبایل نامعتبر است', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (data.success) {
                context.showToast(data.message || 'کد تایید ارسال شد', 'success');
                setStep(2);
            } else {
                context.showToast(data.message || 'خطا در ارسال کد تایید', 'error');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            context.showToast('خطا در برقراری ارتباط با سرور', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 4) {
            context.showToast('کد تایید نامعتبر است', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login/otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    phone, 
                    otp,
                    userType: 'customer',
                 }),
            });

            const data = await response.json();

            if (data.success) {
                // Success login - existing or new minimal user
                const userData: User = {
                    name: data.user.fullName || 'کاربر', // might be null for new users
                    phone: data.user.phone,
                    avatarUrl: data.user.profileImage,
                    walletBalance: 0, 
                    bankCards: []
                };

                context.login(userData, data.token);
                
                if (data.isNewUser) {
                    context.showToast('خوش آمدید! لطفاً پروفایل خود را تکمیل کنید.', 'success');
                    // We rely on App.tsx or HomePage logic to check for missing name/gender and show a modal
                    // But for now, let's just redirect to home.
                } else {
                    context.showToast('خوش آمدید', 'success');
                }
                
                context.setCurrentPage('home');
            } else {
                context.showToast(data.message || 'کد تایید نادرست است', 'error');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            context.showToast('خطا در برقراری ارتباط با سرور', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="h-screen bg-white flex flex-col justify-center items-center p-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">LocalBarber</h1>
            <p className="text-gray-500 mt-2">به اپلیکیشن رزرو آرایشگر خوش آمدید</p>
            
            <div className="w-full mt-12">
                {step === 1 ? (
                    <>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-right mb-1">شماره موبایل</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09123456789"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendOtp();
                                }
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg text-left direction-ltr mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-right">شماره موبایل ۱۱ رقمی خود را وارد کنید.</p>
                        <button 
                            className="w-full bg-blue-600 text-white p-3 rounded-lg mt-4 font-medium disabled:bg-gray-300"
                            onClick={handleSendOtp} 
                            disabled={phone.length < 11 || loading}
                        >
                            {loading ? 'در حال ارسال...' : 'دریافت کد تایید'}
                        </button>
                    </>
                ) : (
                    <>
                         <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-right mb-1">کد تایید</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleVerifyOtp();
                                }
                            }}
                            placeholder="کد ۴ رقمی"
                            className="w-full p-3 border border-gray-300 rounded-lg text-center tracking-[1em] mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={4}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-right">کد ۴ رقمی ارسال شده را وارد کنید.</p>
                        <button 
                            className="w-full bg-blue-600 text-white p-3 rounded-lg mt-4 font-medium disabled:bg-gray-300"
                            onClick={handleVerifyOtp} 
                            disabled={otp.length < 4 || loading}
                        >
                           {loading ? 'در حال بررسی...' : 'ورود'}
                        </button>
                        <button 
                            className="w-full text-blue-600 p-2 mt-2 text-sm"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            تغییر شماره
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
