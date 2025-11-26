import React, { useState, useMemo } from 'react';
import type { AppContextType, BankCard } from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';

export const WalletWithdrawPage: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { user, showToast, updateUser, setCurrentPage } = context;
    const [amount, setAmount] = useState('');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const verifiedCards = useMemo(() => user?.bankCards.filter(c => c.isVerified) || [], [user]);

    // Set default selected card
    React.useEffect(() => {
        if (verifiedCards.length > 0) {
            setSelectedCardId(verifiedCards[0].id);
        }
    }, [verifiedCards]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);

        if (!user) return;

        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue <= 0) {
            setError('مبلغ باید بیشتر از صفر باشد.');
        } else if (numValue > user.walletBalance) {
            setError('مبلغ درخواستی از موجودی شما بیشتر است.');
        } else {
            setError('');
        }
    };

    const handleWithdraw = () => {
        const withdrawAmount = parseInt(amount, 10);
        if (error || !user || !selectedCardId || !withdrawAmount || withdrawAmount <= 0) {
            showToast('لطفا مبلغ و کارت مقصد را به درستی انتخاب کنید.', 'error');
            return;
        }
        
        // Mock API call
        updateUser({ walletBalance: user.walletBalance - withdrawAmount });
        showToast(`مبلغ ${withdrawAmount.toLocaleString('en-US')} تومان با موفقیت برداشت شد.`, 'success');
        setCurrentPage('wallet');
    }

    if (!user) return null;

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col" dir="rtl">
            <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
                <button onClick={() => context.setCurrentPage('wallet')} className="absolute right-0">
                    <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
                </button>
                <h1 className="text-xl font-bold text-center w-full text-[var(--md-sys-color-on-surface)]">برداشت از کیف پول</h1>
            </header>

            <div className="p-4 space-y-6 flex-1 flex flex-col">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">مبلغ برداشت (تومان)</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="50000"
                        className="form-input font-mono text-lg"
                    />
                    <p className="text-xs text-right mt-2 h-4" style={{ color: error ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)'}}>
                        {error || `موجودی قابل برداشت: ${user.walletBalance.toLocaleString('en-US')} تومان`}
                    </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
                    <h2 className="text-lg font-bold mb-3">انتخاب کارت مقصد</h2>
                    {verifiedCards.length > 0 ? (
                        <div className="space-y-2">
                            {verifiedCards.map(card => (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`w-full flex items-center text-right p-3 rounded-lg border-2 transition-all ${selectedCardId === card.id ? 'border-[var(--md-sys-color-primary)] bg-blue-50' : 'border-gray-200'}`}
                                >
                                    <Icon name="creditCard" className="w-6 h-6 text-gray-500 ml-3"/>
                                    <div>
                                        <p className="font-semibold">{card.bankName}</p>
                                        <p className="text-sm text-gray-500 font-mono tracking-widest">**** **** **** {card.last4}</p>
                                    </div>
                                    <div className="mr-auto w-5 h-5 flex items-center justify-center border-2 rounded-full"
                                        style={{ borderColor: selectedCardId === card.id ? 'var(--md-sys-color-primary)' : '#ccc' }}>
                                        {selectedCardId === card.id && <div className="w-2.5 h-2.5 bg-[var(--md-sys-color-primary)] rounded-full"></div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 p-4">
                            برای برداشت وجه، ابتدا باید یک کارت بانکی را اضافه و تایید کنید.
                        </p>
                    )}
                </div>
                
                <Button onClick={handleWithdraw} disabled={!!error || verifiedCards.length === 0} sticky={true}>
                    تایید و برداشت
                </Button>
            </div>
        </div>
    );
};