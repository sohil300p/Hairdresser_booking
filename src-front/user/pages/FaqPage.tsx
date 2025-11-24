import React, { useState } from 'react';
import type { UserContextType } from '../types';
import { Icon } from '../../shared/components/Icon';

const FAQ_DATA = [
    {
        question: 'چگونه می‌توانم یک وقت رزرو کنم؟',
        answer: 'برای رزرو وقت، ابتدا آرایشگاه مورد نظر خود را از صفحه اصلی یا صفحه جستجو انتخاب کنید. سپس از لیست خدمات، سرویس مورد نظر خود را انتخاب کرده و روی دکمه "رزرو" کلیک کنید. در صفحه بعد، تاریخ و ساعت دلخواه خود را انتخاب و رزرو خود را نهایی کنید.',
    },
    {
        question: 'سیاست لغو و استرداد وجه چگونه است؟',
        answer: 'شما می‌توانید رزرو خود را لغو کنید. سیاست استرداد وجه به شرح زیر است:\n• لغوهایی که بیش از ۳ ساعت قبل از زمان رزرو انجام شوند، شامل بازپرداخت ۱۰۰٪ مبلغ خواهند بود.\n• لغوهایی که ۳ ساعت یا کمتر قبل از زمان رزرو انجام شوند، مشمول جریمه ۲۵٪ خواهند شد.',
    },
    {
        question: 'چگونه می‌توانم کیف پول خود را شارژ کنم؟',
        answer: 'از منوی پروفایل وارد بخش "کیف پول" شوید. در آنجا می‌توانید با استفاده از کارت‌های بانکی عضو شتاب، کیف پول خود را به میزان دلخواه شارژ کنید.',
    },
    {
        question: 'آیا امکان پرداخت در محل وجود دارد؟',
        answer: 'بله، هنگام نهایی کردن رزرو، می‌توانید روش پرداخت "پرداخت در محل" را انتخاب کنید. همچنین می‌توانید از موجودی کیف پول خود برای پرداخت استفاده نمایید.',
    },
];

const AccordionItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white rounded-lg border border-gray-200 mb-3 text-right overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 font-semibold text-gray-800"
            >
                <span>{question}</span>
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <Icon name="chevronLeft" className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 pt-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {answer}
                </div>
            </div>
        </div>
    );
};

export const FaqPage: React.FC<{ context: UserContextType }> = ({ context }) => {
    return (
        <div className="bg-gray-50 min-h-screen" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('support-center')} className="absolute right-0">
                    <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">سوالات متداول</h1>
            </header>

            <div className="px-4">
                {FAQ_DATA.map((item, index) => (
                    <AccordionItem key={index} question={item.question} answer={item.answer} />
                ))}
            </div>
        </div>
    );
};