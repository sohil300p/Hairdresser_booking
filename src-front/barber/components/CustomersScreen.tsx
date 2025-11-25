

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, Star, ArrowUpCircle, ArrowDownCircle, ChevronLeft, Phone, Gift } from 'lucide-react';

interface LoyaltyHistory {
  id: number;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  date: string;
}

interface Customer {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  points: number;
  history: LoyaltyHistory[];
}

const customers: Customer[] = [
    { id: 1, name: 'احمد رضایی', phone: '09123456789', avatar: 'https://picsum.photos/id/1005/100/100', points: 150, history: [
        { id: 1, type: 'earn', points: 50, description: 'اصلاح مو', date: '۱۴۰۳/۰۴/۲۰' },
        { id: 2, type: 'earn', points: 100, description: 'اصلاح مو + ریش', date: '۱۴۰۳/۰۵/۱۰' },
    ]},
    { id: 2, name: 'حسن محمدی', phone: '09121112233', avatar: 'https://picsum.photos/id/1006/100/100', points: 30, history: [
        { id: 1, type: 'earn', points: 50, description: 'اصلاح مو', date: '۱۴۰۳/۰۵/۰۱' },
        { id: 2, type: 'redeem', points: 20, description: 'تخفیف', date: '۱۴۰۳/۰۵/۰۱' },
    ]},
    { id: 3, name: 'علی اکبری', phone: '09355554433', avatar: 'https://picsum.photos/id/1008/100/100', points: 250, history: [
        { id: 1, type: 'earn', points: 250, description: 'کراتینه', date: '۱۴۰۳/۰۵/۱۱' },
    ]},
    { id: 4, name: 'مریم قاسمی', phone: '09109876543', avatar: 'https://picsum.photos/id/1011/100/100', points: 0, history: []},
    { id: 5, name: 'سارا نادری', phone: '09331231231', avatar: 'https://picsum.photos/id/1012/100/100', points: 80, history: [
        { id: 1, type: 'earn', points: 80, description: 'اصلاح صورت', date: '۱۴۰۳/۰۵/۱۲' },
    ]},
];

interface CustomersScreenProps {
    initialCustomerId: number | null;
    onDetailBack: () => void;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ initialCustomerId, onDetailBack }) => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [zoomedAvatar, setZoomedAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (initialCustomerId) {
            const customer = customers.find(c => c.id === initialCustomerId);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
    }, [initialCustomerId]);

    const handleBackFromDetail = () => {
        setSelectedCustomer(null);
        onDetailBack();
    }

    const filteredCustomers = useMemo(() =>
        customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.phone.includes(searchTerm)
        ),
        [searchTerm]
    );

    if (selectedCustomer) {
        return <CustomerDetail customer={selectedCustomer} onBack={handleBackFromDetail} />;
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
                    <h1 className="text-2xl font-bold mb-4">مشتریان</h1>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="جستجوی نام یا شماره تماس..." 
                            className="w-full h-12 p-3 pr-12 bg-surface-2 border border-surface-2 text-gray-900 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-0 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    </div>
                </header>
                <main className="flex-grow p-4 space-y-3">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className="w-full text-right flex items-center justify-between p-3 bg-white rounded-lg border shadow-xs cursor-pointer hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); setZoomedAvatar(customer.avatar); }} className="focus:outline-none rounded-full focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                    <img src={customer.avatar} alt={customer.name} className="w-12 h-12 rounded-full" />
                                </button>
                                <div>
                                    <p className="font-bold">{customer.name}</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1" dir="ltr">
                                        {customer.phone} <Phone size={14} />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1 text-sm text-warning-600">
                                    <Star size={14} fill="currentColor" />
                                    <span className="font-semibold">{customer.points}</span>
                                </div>
                                <ChevronLeft className="text-gray-600" />
                            </div>
                        </div>
                    ))}
                </main>
            </div>
            {zoomedAvatar && (
                <div 
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" 
                    onClick={() => setZoomedAvatar(null)}
                >
                    <img src={zoomedAvatar} className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl" alt="بزرگنمایی آواتار" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </>
    );
};

const CustomerDetail: React.FC<{ customer: Customer; onBack: () => void }> = ({ customer, onBack }) => {
    const visitCount = customer.history.filter(h => h.type === 'earn').length;
    const isLoyal = visitCount >= 2;

    const handleManageLoyalty = () => {
       window.showToast("برای مدیریت امتیازات لطفا به بخش 'باشگاه مشتریان' مراجعه کنید.", 'info');
    };

    return (
        <div className="flex flex-col h-full bg-surface-1">
            <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onBack} aria-label="بازگشت"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">پروفایل مشتری</h1>
            </header>
            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {/* Profile Summary Card */}
                <div className="bg-white p-4 rounded-lg border shadow-xs">
                    <div className="flex items-center gap-4">
                        <img src={customer.avatar} alt={customer.name} className="w-20 h-20 rounded-full border-4 border-primary-100" />
                        <div>
                            <h2 className="text-xl font-bold">{customer.name}</h2>
                            <p className="text-gray-600" dir="ltr">{customer.phone}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-around">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">تعداد مراجعه</p>
                            <p className="font-bold text-lg">{visitCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">وضعیت</p>
                            <p className={`font-bold text-lg ${isLoyal ? 'text-success-600' : 'text-gray-600'}`}>
                                {isLoyal ? 'وفادار' : 'عادی'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loyalty Points Card */}
                <div className="bg-white p-4 rounded-lg border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-700">امتیاز وفاداری</p>
                        <p className="text-3xl font-bold text-warning-500 mt-1">{customer.points}</p>
                    </div>
                    <button 
                        onClick={handleManageLoyalty}
                        className="bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-md text-sm transition hover:bg-primary-100 flex items-center gap-2"
                    >
                        <Gift size={16} />
                        مدیریت
                    </button>
                </div>

                {/* History Card */}
                <div className="bg-white rounded-lg border shadow-xs">
                    <h3 className="font-bold p-4 border-b">تاریخچه امتیازات</h3>
                    <div className="space-y-1 p-2 max-h-60 overflow-y-auto">
                        {customer.history.length > 0 ? customer.history.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-surface-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'earn' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                                        {item.type === 'earn' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{item.description}</p>
                                        <p className="text-xs text-gray-600">{item.date}</p>
                                    </div>
                                </div>
                                <p className={`font-bold ${item.type === 'earn' ? 'text-success-600' : 'text-error-600'}`}>
                                    {item.type === 'earn' ? '+' : '-'}{item.points}
                                </p>
                            </div>
                        )) : (
                             <p className="text-center text-sm text-gray-700 py-4">تاریخچه‌ای برای نمایش وجود ندارد.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomersScreen;
