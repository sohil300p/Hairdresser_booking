import React from 'react';
import type { AppContextType } from '../types';
import { Icon } from '../components/Icon';

export const DiscountsPage: React.FC<{ context: AppContextType }> = ({ context }) => {

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        context.showToast('کد تخفیف کپی شد!', 'success');
    }

    return (
        <div className="bg-gray-50 min-h-screen" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">تخفیف‌های من</h1>
            </header>

            <div className="space-y-4 px-4">
                {context.discounts.map(discount => (
                    <div key={discount.id} className="bg-white p-4 rounded-lg border border-gray-200 text-right">
                        <p className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">{discount.description}</p>
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-2 border-2 border-dashed border-blue-200 bg-blue-50 p-2 rounded-lg">
                                <span className="font-mono font-semibold text-blue-800">{discount.code}</span>
                                <Icon name="copy" className="w-5 h-5 text-blue-600 cursor-pointer" onClick={() => handleCopy(discount.code)} />
                            </div>
                            <button onClick={() => context.setCurrentPage('home')} className="bg-[var(--md-sys-color-primary)] text-white px-4 py-1 rounded-md text-sm font-semibold">
                                استفاده
                            </button>
                        </div>
                    </div>
                ))}
                 {context.discounts.length === 0 && (
                    <p className="text-center text-gray-500 mt-12">در حال حاضر تخفیفی برای شما وجود ندارد.</p>
                )}
            </div>
        </div>
    );
}