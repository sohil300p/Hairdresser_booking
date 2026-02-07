

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ArrowRight, Star, ChevronLeft, Phone, Gift, Users } from 'lucide-react';
import { api } from '../utils/api';
import type { GetCustomersResponse, CustomerItem } from '../types/api';

interface Customer {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  visitCount: number;
  totalSpent: number;
  lastVisitDate: number | null;
}

function mapApiCustomerToCustomer(item: CustomerItem): Customer {
  return {
    id: item.id,
    name: item.fullName || 'مشتری',
    avatar: item.avatar || 'https://picsum.photos/id/0/100/100',
    phone: item.phone,
    visitCount: item.visitCount,
    totalSpent: item.totalSpent,
    lastVisitDate: item.lastVisitDate,
  };
}

function formatDateFa(ts: number): string {
  return new Date(ts).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface CustomersScreenProps {
    initialCustomerId: number | null;
    onDetailBack: () => void;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ initialCustomerId, onDetailBack }) => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [zoomedAvatar, setZoomedAvatar] = useState<string | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await api.get<GetCustomersResponse>('/barber/customers');
            if (res.success && res.data) {
                setCustomers(res.data.customers.map(mapApiCustomerToCustomer));
            }
        } catch {
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        if (initialCustomerId && customers.length > 0) {
            const customer = customers.find(c => c.id === initialCustomerId);
            if (customer) setSelectedCustomer(customer);
        }
    }, [initialCustomerId, customers]);

    const handleBackFromDetail = () => {
        setSelectedCustomer(null);
        onDetailBack();
    };

    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        ),
        [customers, searchTerm]
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
                    {isLoading ? (
                        <div className="text-center py-16 text-gray-600">در حال بارگذاری...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center">
                            <Users size={48} className="text-gray-300 mb-4" />
                            <p className="font-bold text-lg text-gray-700">هیچ مشتری یافت نشد</p>
                            <p className="text-gray-600 mt-1">
                                {searchTerm.trim() ? 'با این جستجو مشتریی برای نمایش وجود ندارد.' : 'در این دسته‌بندی مشتریی برای نمایش وجود ندارد.'}
                            </p>
                        </div>
                    ) : filteredCustomers.map(customer => (
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
                                    <span className="font-semibold">{customer.visitCount} مراجعه</span>
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
    const isLoyal = customer.visitCount >= 2;

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
                <div className="bg-white p-4 rounded-lg border shadow-xs">
                    <div className="flex items-center gap-4">
                        <img src={customer.avatar} alt={customer.name} className="w-20 h-20 rounded-full border-4 border-primary-100 object-cover" />
                        <div>
                            <h2 className="text-xl font-bold">{customer.name}</h2>
                            <p className="text-gray-600" dir="ltr">{customer.phone}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-around">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">تعداد مراجعه</p>
                            <p className="font-bold text-lg">{customer.visitCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">وضعیت</p>
                            <p className={`font-bold text-lg ${isLoyal ? 'text-success-600' : 'text-gray-600'}`}>
                                {isLoyal ? 'وفادار' : 'عادی'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-700">مجموع خرید</p>
                        <p className="text-3xl font-bold text-warning-500 mt-1">{customer.totalSpent.toLocaleString('fa-IR')} تومان</p>
                    </div>
                    <button
                        onClick={handleManageLoyalty}
                        className="bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-md text-sm transition hover:bg-primary-100 flex items-center gap-2"
                    >
                        <Gift size={16} />
                        مدیریت
                    </button>
                </div>

                <div className="bg-white rounded-lg border shadow-xs">
                    <h3 className="font-bold p-4 border-b">آخرین مراجعه</h3>
                    <div className="p-4">
                        {customer.lastVisitDate ? (
                            <p className="text-gray-700">{formatDateFa(customer.lastVisitDate)}</p>
                        ) : (
                            <p className="text-gray-700">تاریخچه‌ای برای نمایش وجود ندارد.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomersScreen;
