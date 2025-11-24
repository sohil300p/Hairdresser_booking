import React, { useState } from 'react';
import type { UserContextType } from '../types';
import type { BankCard } from '../../shared/types/common';
import { Icon } from '../../shared/components/Icon';
import { Button } from '../../shared/components/Button';

export const WalletPage: React.FC<{ context: UserContextType }> = ({ context }) => {
    const { user, chargeWallet, addBankCard, verifyBankCard, deleteBankCard } = context;
    const [showAddCard, setShowAddCard] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [otp, setOtp] = useState('');
    const [verifyingCardId, setVerifyingCardId] = useState<string | null>(null);

    const handleAddCard = () => {
        if(cardNumber.length >= 4 && bankName.trim()) {
            addBankCard({ last4: cardNumber.slice(-4), bankName });
            setCardNumber('');
            setBankName('');
            setShowAddCard(false);
        } else {
            context.showToast('اطلاعات کارت صحیح نیست.', 'error');
        }
    }
    
    const handleVerifyClick = (cardId: string) => {
        setVerifyingCardId(cardId);
        context.showToast('کد تایید به شماره شما ارسال شد.', 'success'); // Mock
        context.showModal(
            <div className="text-center p-2" dir="rtl">
                <h3 className="text-lg font-bold mb-2">تایید کارت بانکی</h3>
                <p className="text-sm text-gray-500 mb-4">کد ۴ رقمی ارسال شده به موبایل خود را وارد کنید.</p>
                <input 
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="form-input text-center tracking-[1em] font-mono"
                />
                <div className="flex gap-2 mt-4">
                    <Button variant="secondary" onClick={() => {
                        context.hideModal();
                        setOtp('');
                        setVerifyingCardId(null);
                    }}>لغو</Button>
                    <Button onClick={handleVerifySubmit}>تایید</Button>
                </div>
            </div>,
            'bottom'
        );
    }
    
    const handleVerifySubmit = () => {
        if (verifyingCardId) {
            verifyBankCard(verifyingCardId, otp);
            setOtp('');
            setVerifyingCardId(null);
        }
    }

    const handleDeleteClick = (card: BankCard) => {
        context.showModal(
          <div className="text-right p-2">
            <h3 className="text-xl font-bold mb-4 text-center">حذف کارت بانکی</h3>
            <p className="text-gray-600 mb-4 text-center">
              آیا از حذف کارت به شماره <strong className="font-mono tracking-wider">**** {card.last4}</strong> مطمئن هستید؟
            </p>
            <p className="text-xs text-gray-400 bg-gray-100 p-2 rounded-md text-center mb-6">
               توجه: برای تکمیل این فرآیند ممکن است به تایید هویت (مثلا رمز یکبار مصرف) نیاز باشد.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={context.hideModal}>انصراف</Button>
              <Button variant="danger" onClick={() => deleteBankCard(card.id)}>
                بله، حذف کن
              </Button>
            </div>
          </div>,
          'bottom'
        );
      };

    if (!user) return null;

    return (
        <div className="bg-gray-50 min-h-screen" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
                    <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">کیف پول</h1>
            </header>

            <div className="px-4">
                <div className="bg-gradient-to-br from-[var(--md-sys-color-primary)] to-[var(--md-sys-color-on-surface)] text-white p-6 rounded-2xl shadow-lg text-center">
                    <p className="opacity-80">موجودی کیف پول</p>
                    <p className="text-4xl font-bold font-mono my-2">{user.walletBalance.toLocaleString('en-US')}</p>
                    <p>تومان</p>
                    <div className="flex gap-3 mt-6">
                        <Button onClick={() => context.setCurrentPage('wallet-withdraw')} className="flex-1 bg-white/20 text-white hover:bg-white/30 w-auto px-6 py-2">
                           برداشت
                        </Button>
                        <Button onClick={() => chargeWallet(50000)} className="flex-1 bg-white/20 text-white hover:bg-white/30 w-auto px-6 py-2">
                            شارژ
                        </Button>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-lg font-bold text-right mb-4">کارت‌های بانکی</h2>
                    {user.bankCards.map(card => (
                        <div key={card.id} className="bg-white p-4 rounded-lg border border-gray-200 mb-3 flex justify-between items-center">
                            <div className="flex items-center">
                                <Icon name="creditCard" className="w-8 h-8 text-gray-400 ml-4" />
                                <div>
                                    <p className="font-semibold">{card.bankName}</p>
                                    <p className="text-sm text-gray-500 font-mono tracking-widest">**** **** **** {card.last4}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {card.isVerified ? 
                                    <span className="text-xs text-[var(--md-sys-color-tertiary)] font-semibold flex items-center gap-1"><Icon name="verified" className="w-4 h-4" /> تایید شده</span> :
                                    <Button onClick={() => handleVerifyClick(card.id)} variant="ghost" className="py-1 px-3 text-xs w-auto">تایید کارت</Button>
                                }
                                <button onClick={() => handleDeleteClick(card)} className="p-1 text-gray-400 hover:text-[var(--md-sys-color-error)]">
                                    <Icon name="trash" className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {!showAddCard && (
                        <button onClick={() => setShowAddCard(true)} className="w-full flex items-center justify-center gap-2 p-3 mt-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100">
                            <Icon name="plus" className="w-5 h-5" />
                            <span>افزودن کارت جدید</span>
                        </button>
                    )}

                    {showAddCard && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4 text-right">
                            <h3 className="font-bold mb-4">افزودن کارت جدید</h3>
                            <label className="text-sm">نام بانک</label>
                            <input value={bankName} onChange={e => setBankName(e.target.value)} type="text" className="form-input mb-3" placeholder="مثلا بانک ملی"/>
                            <label className="text-sm">شماره کارت</label>
                            <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} type="text" maxLength={16} className="form-input mb-4 font-mono" placeholder="6037..." />
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setShowAddCard(false)}>لغو</Button>
                                <Button onClick={handleAddCard}>افزودن</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};