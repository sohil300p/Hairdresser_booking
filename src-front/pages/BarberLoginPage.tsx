import React, { useState } from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { authService } from '../src/services/auth.service';

interface BarberLoginPageProps {
    context: AppContextType;
}

export const BarberLoginPage: React.FC<BarberLoginPageProps> = ({ context }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = async () => {
        if (phone.length < 11) {
            context.showToast('شماره موبایل باید ۱۱ رقمی باشد.', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await authService.sendOtp(phone);
            if (result.success) {
                setOtpSent(true);
                setStep(2);
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
        if (otp.length < 4) {
            context.showToast('کد تایید باید ۴ رقمی باشد.', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await authService.verifyOtp(phone, otp);
            if (result.success && result.user) {
                const userData = {
                    name: result.user.firstName && result.user.lastName
                        ? `${result.user.firstName} ${result.user.lastName}`
                        : result.user.firstName || result.user.lastName || result.user.phone,
                    phone: result.user.phone,
                    walletBalance: 0,
                    bankCards: [],
                    avatarUrl: result.user.profileImage || undefined,
                };
                await context.login(userData);
                context.setCurrentPage('home');
                context.showToast('ورود با موفقیت انجام شد', 'success');
            } else {
                context.showToast(result.message || 'کد وارد شده صحیح نیست', 'error');
            }
        } catch (error: any) {
            context.showToast(error.response?.data?.message || 'خطا در تایید کد', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="h-screen bg-white flex flex-col justify-center items-center p-8">
            <Logo height={80} className="mb-2" />
            <p className="text-gray-500">ورود به پنل آرایشگر</p>
            
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
                        <p className="text-xs text-center text-gray-500 mt-2">جهت ورود به پنل آرایشگر، شماره همراه خود را وارد کنید.</p>
                    </>
                ) : (
                    <>
                         <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-right mb-1">کد تایید</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="کد ۴ رقمی"
                            className="form-input text-center tracking-[1em]"
                            maxLength={4}
                            disabled={loading}
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">کد ۴ رقمی ارسال شده را وارد کنید.</p>
                        <Button className="mt-4" onClick={handleVerifyOtp} disabled={otp.length < 4 || loading}>
                            {loading ? 'در حال تایید...' : 'ورود'}
                        </Button>

                        {otpSent && (
                            <Button 
                                className="mt-2 bg-transparent border-2 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)] hover:bg-blue-50"
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                ارسال مجدد کد
                            </Button>
                        )}
                    </>
                )}
            </div>
            <button className="mt-8 text-sm text-gray-500 hover:text-[var(--primary)]" onClick={() => context.setCurrentPage('login')}>
                ورود به عنوان مشتری
            </button>
        </div>
    )
}

