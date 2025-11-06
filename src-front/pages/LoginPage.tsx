
import React, { useState } from 'react';
import type { AppContextType } from '../types';
import { Button } from '../components/Button';

interface LoginPageProps {
    context: AppContextType;
}

export const LoginPage: React.FC<LoginPageProps> = ({ context }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);

    const handleLogin = () => {
        // In a real app, you would verify the OTP
        if (otp === '1234') {
            context.login();
            context.setCurrentPage('home');
        } else {
            context.showToast('کد وارد شده صحیح نیست.', 'error');
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
                            className="form-input text-left direction-ltr"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-right">شماره موبایل ۱۱ رقمی خود را وارد کنید.</p>
                        <Button className="mt-4" onClick={() => setStep(2)} disabled={phone.length < 11}>
                            دریافت کد تایید
                        </Button>
                    </>
                ) : (
                    <>
                         <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-right mb-1">کد تایید</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="کد ۴ رقمی (1234)"
                            className="form-input text-center tracking-[1em]"
                            maxLength={4}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-right">کد ۴ رقمی ارسال شده را وارد کنید.</p>
                        <Button className="mt-4" onClick={handleLogin} disabled={otp.length < 4}>
                           ورود
                        </Button>
                    </>
                )}
            </div>
             <button className="mt-8 text-sm text-gray-500 hover:text-[var(--primary)]" onClick={() => { context.login(); context.setCurrentPage('home');}}>
                فعلا رد شو
            </button>
        </div>
    )
}