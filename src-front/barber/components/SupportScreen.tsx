

import React from 'react';
// Import the shared Screen type from App.tsx for navigation callbacks.
import type { Screen } from '../App';
import { ArrowRight, Send, ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'چگونه ساعات کاری خود را تغییر دهم؟',
        answer: 'از منوی پایین صفحه به بخش «پروفایل» بروید. سپس روی گزینه «ساعات کاری» کلیک کرده و روزها و ساعات مورد نظر خود را ویرایش و ذخیره کنید.'
    },
    {
        question: 'چطور یک خدمت جدید به لیست خدماتم اضافه کنم؟',
        answer: 'در صفحه «پروفایل»، گزینه «خدمات و قیمت‌گذاری» را انتخاب کنید. در صفحه باز شده، روی دکمه «افزودن خدمت جدید» کلیک کرده و اطلاعات خدمت جدید را وارد نمایید.'
    },
    {
        question: 'آیا امکان ثبت رزرو به صورت دستی وجود دارد؟',
        answer: 'بله، در صفحه «رزروها» یک دکمه شناور با علامت مثبت (+) وجود دارد. با کلیک بر روی آن می‌توانید یک رزرو جدید به صورت دستی برای مشتریان خود ثبت کنید.'
    },
    {
        question: 'موجودی کیف پول من چگونه محاسبه می‌شود و کی قابل برداشت است؟',
        answer: 'موجودی شما پس از تکمیل هر رزرو آنلاین محاسبه و به کیف پول شما اضافه می‌شود. شما می‌توانید هر زمان که بخواهید از بخش «پروفایل» و سپس «کیف پول و درآمد» درخواست برداشت وجه خود را ثبت کنید.'
    },
    {
        question: 'چگونه کد تخفیف برای مشتریانم بسازم؟',
        answer: 'در صفحه «پروفایل»، گزینه «مدیریت تخفیف‌ها» را انتخاب کنید. در آنجا می‌توانید کدهای تخفیف جدید با درصد و شرایط دلخواه خود ایجاد کرده و حتی برای مشتریان مورد نظر خود پیامک کنید.'
    }
];

const SupportScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({ setActiveScreen }) => {
    
    const openLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setActiveScreen('profile')} aria-label="بازگشت به پروفایل"><ArrowRight /></button>
                    <h1 className="text-2xl font-bold">پشتیبانی</h1>
                </div>
            </header>
            <main className="flex-grow p-4 space-y-6 overflow-y-auto">
                <div className="bg-white p-6 rounded-lg border shadow-xs text-center">
                    <h2 className="text-lg font-bold mb-2">تماس با پشتیبانی</h2>
                    <p className="text-sm text-gray-700 mb-6">برای دریافت پشتیبانی، از طریق یکی از پیام‌رسان‌های زیر با ما در ارتباط باشید.</p>
                    
                    <div className="space-y-4">
                        <button 
                            type="button"
                            onClick={() => openLink('https://wa.me/989123456789')}
                            className="w-full h-14 bg-success-500 text-white font-bold p-3 rounded-md flex items-center justify-center gap-3 transition duration-200 ease-in-out shadow-sm hover:bg-success-600 active:bg-success-700"
                        >
                            <Send size={20} />
                            <span>پشتیبانی در واتساپ</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => openLink('https://t.me/cutchee_support')}
                            className="w-full h-14 bg-info-500 text-white font-bold p-3 rounded-md flex items-center justify-center gap-3 transition duration-200 ease-in-out shadow-sm hover:bg-info-600 active:bg-info-700"
                        >
                           <Send size={20} />
                           <span>پشتیبانی در تلگرام</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-xs">
                    <h2 className="text-lg font-bold mb-4 text-center">سوالات متداول</h2>
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            <details key={index} className="group bg-surface-1 rounded-lg transition-all duration-300 open:bg-primary-50">
                                <summary className="p-4 font-semibold cursor-pointer flex justify-between items-center list-none text-gray-800 group-hover:text-primary-700">
                                    {faq.question}
                                    <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <div className="p-4 pt-0 text-gray-700 text-sm leading-relaxed">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SupportScreen;
