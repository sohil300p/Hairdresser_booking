
import React, { useState, useRef, useEffect } from 'react';
import { Scissors, ArrowLeft } from 'lucide-react';
import MaterialInput from './MaterialInput';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(120);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 11 && /^\d+$/.test(phone)) {
      setPhoneError('');
      setStep('otp');
      setTimer(120);
    } else {
        setPhoneError('شماره موبایل باید ۱۱ رقم عددی باشد.')
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };
  
  const handleOtpSubmit = () => {
    onLoginSuccess();
  }

  const formattedTime = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-1 p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
            <div 
              className="relative flex items-center justify-center font-light text-6xl text-gray-700 tracking-[0.15em]"
            >
              <span>CU</span>
              <Scissors className="w-12 h-12 text-primary-600 mx-[-0.2em] transform -rotate-12"/>
              <span>CHEE</span>
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {step === 'phone' ? 'ورود یا ثبت نام' : 'کد تایید را وارد کنید'}
        </h2>
        <p className="text-center text-gray-700 mb-8 min-h-[40px]">
            {step === 'phone' ? 'برای ورود یا ثبت نام، شماره موبایل خود را وارد کنید.' : `کد تایید به شماره ${phone} ارسال شد.`}
        </p>

        <div className="relative h-[280px] overflow-hidden">
            <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${step === 'phone' ? 'translate-x-0' : '-translate-x-full'}`}>
                 <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <MaterialInput
                      id="phone"
                      label="شماره موبایل"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                      }}
                      error={phoneError}
                      maxLength={11}
                      className="text-center tracking-[.2em]"
                      required
                      inputMode="numeric"
                    />
                    <button
                      type="submit"
                      disabled={phone.length !== 11}
                      className="w-full h-12 bg-primary-600 text-white font-bold p-3 rounded-md disabled:bg-gray-300 disabled:text-gray-500 transition duration-200 ease-in-out shadow-sm hover:bg-primary-700 hover:shadow-primary active:bg-primary-800 active:shadow-none active:translate-y-px"
                    >
                      دریافت کد تایید
                    </button>
                  </form>
            </div>
            <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${step === 'otp' ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="space-y-6">
                    <div className="flex justify-center gap-2" dir="ltr">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-14 text-center text-2xl font-bold text-gray-900 bg-surface-2 border-b-2 border-gray-400 rounded-t-md focus:outline-none focus:border-primary-600 transition"
                          aria-label={`Digit ${index + 1} of OTP`}
                        />
                      ))}
                    </div>
                     <button
                      onClick={handleOtpSubmit}
                      disabled={otp.join('').length !== 6}
                      className="w-full h-12 bg-success-500 text-white font-bold p-3 rounded-md disabled:bg-gray-300 disabled:text-gray-500 transition hover:bg-success-600"
                    >
                      تایید و ادامه
                    </button>
                    <div className="text-center text-sm text-gray-700">
                      {timer > 0 ? (
                        <span>ارسال مجدد کد تا {formattedTime}</span>
                      ) : (
                        <button onClick={() => setTimer(120)} className="text-primary-600 font-semibold">ارسال مجدد کد</button>
                      )}
                    </div>
                     <button onClick={() => setStep('phone')} className="flex items-center justify-center gap-2 w-full text-gray-700">
                       <ArrowLeft size={16} />
                       <span>ویرایش شماره موبایل</span>
                     </button>
                  </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
