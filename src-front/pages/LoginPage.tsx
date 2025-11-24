import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../shared/components/Button';
import { Logo } from '../shared/components/Logo';
import { authService } from '../user/services/auth.service';
import type { User } from '../shared/types/common';

interface LoginPageProps {
    context: any;
    onLoginSuccess?: (user: User, role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ context, onLoginSuccess }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Timer effect
    useEffect(() => {
        if (timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timeRemaining]);

    const handleSendOtp = async () => {
        // Trim phone number
        const trimmedPhone = phone.trim();
        
        if (trimmedPhone.length < 11) {
            context.showToast('شماره موبایل باید ۱۱ رقمی باشد.', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await authService.sendOtp(trimmedPhone);
            if (result.success) {
                setOtpSent(true);
                setStep(2);
                // Start countdown timer (default 60 seconds if expiresIn not provided)
                setTimeRemaining(result.expiresIn || 60);
                context.showToast(result.message || 'کد تایید ارسال شد', 'success');
            } else {
                context.showToast(result.message || 'خطا در ارسال کد تایید', 'error');
            }
        } catch (error: any) {
            context.showToast(error.response?.data?.message || 'خطا در ارسال کد تایید', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        // Trim and validate OTP
        const trimmedOtp = otp.trim();
        
        if (trimmedOtp.length !== 4) {
            context.showToast('کد تایید باید دقیقاً ۴ رقمی باشد.', 'error');
            return;
        }

        // Validate that OTP contains only digits
        if (!/^\d{4}$/.test(trimmedOtp)) {
            context.showToast('کد تایید باید فقط شامل اعداد باشد.', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await authService.verifyOtp(phone.trim(), trimmedOtp);
            if (result.success && result.user) {
                const userData: User = {
                    id: result.user.id,
                    name: result.user.firstName && result.user.lastName
                        ? `${result.user.firstName} ${result.user.lastName}`
                        : result.user.firstName || result.user.lastName || result.user.phone,
                    phone: result.user.phone,
                    walletBalance: 0,
                    bankCards: [],
                    avatarUrl: result.user.profileImage || undefined,
                    role: result.user.role,
                };
                if (onLoginSuccess) {
                    onLoginSuccess(userData, result.user.role);
                } else if (context && context.login) {
                    await context.login(userData);
                    if (context.setCurrentPage) {
                        context.setCurrentPage('home');
                    }
                }
                if (context && context.showToast) {
                    context.showToast('ورود با موفقیت انجام شد', 'success');
                }
            } else {
                context.showToast(result.message || 'کد وارد شده صحیح نیست', 'error');
            }
        } catch (error: any) {
            console.error('OTP verification error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'خطا در تایید کد';
            context.showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="h-screen bg-white flex flex-col justify-center items-center p-8">
            <Logo height={80} className="mb-2" />
            {/* <h1 className="text-3xl font-bold text-[var(--text-primary)]">KitChi</h1> */}
            <p className="text-gray-500">به اپلیکیشن رزرو آرایشگر خوش آمدید</p>
            
            <div className="w-full mt-6">
                {step === 1 ? (
                    <>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-right mb-1">شماره موبایل</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="09123456789"
                            className="form-input text-left direction-ltr"
                            disabled={loading}
                        />
                        <Button className="mt-4" onClick={handleSendOtp} disabled={phone.length < 11 || loading}>
                            {loading ? 'در حال ارسال...' : 'دریافت کد تایید'}
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">جهت وورد و رزرو وقت آرایشگاه، شماره همراه خود را وارد کنید.</p>
                    </>
                ) : (
                    <>
                         <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-right mb-1">کد تایید</label>
                        <input
                            type="tel"
                            id="otp"
                            value={otp}
                            onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                    setOtp(value);
                                }
                            }}
                            placeholder="کد ۴ رقمی"
                            className="form-input text-center tracking-[1em]"
                            maxLength={4}
                            pattern="[0-9]{4}"
                            inputMode="numeric"
                            disabled={loading}
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">کد ۴ رقمی ارسال شده را وارد کنید.</p>
                        
                        {/* OTP Expiry Timer */}
                        {timeRemaining > 0 && (
                            <div className="text-center mt-2 mb-2">
                                <p className="text-sm text-gray-600">
                                    زمان باقیمانده: <span className="font-bold text-[var(--md-sys-color-primary)]">{timeRemaining}</span> ثانیه
                                </p>
                            </div>
                        )}

                        <Button className="mt-4" onClick={handleVerifyOtp} disabled={otp.length < 4 || loading}>
                            {loading ? 'در حال تایید...' : 'ورود'}
                        </Button>

                        {otpSent && (
                            <Button 
                                className="mt-2 bg-transparent border-2 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)] hover:bg-blue-50"
                                onClick={handleSendOtp}
                                disabled={loading || timeRemaining > 0}
                            >
                                {timeRemaining > 0 ? `ارسال مجدد (${timeRemaining} ثانیه)` : 'ارسال مجدد کد'}
                            </Button>
                        )}
                    </>
                )}
            </div>
            <Button 
                className="mt-6 bg-transparent border-2 text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]"
                onClick={() => {
                    context.setCurrentPage('barber-login');
                }}
            >
                ثبت نام به عنوان آرایشگر
            </Button>
            <button className="mt-4 text-sm text-gray-500 hover:text-[var(--primary)]" onClick={() => {
                const mockUser: User = {
                    id: 0,
                    name: 'کاربر مهمان',
                    phone: '09000000000',
                    walletBalance: 0,
                    bankCards: [],
                    role: 'CUSTOMER',
                };
                if (onLoginSuccess) {
                    onLoginSuccess(mockUser, 'CUSTOMER');
                } else if (context && context.login) {
                    context.login(mockUser);
                }
            }}>
                فعلا نمیخواد
            </button>
        </div>
    )
}