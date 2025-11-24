import React, { useState, useEffect } from 'react';
import { Bell, Users, Calendar, DollarSign, ChevronLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HomeScreenSkeleton } from '../components/SkeletonLoader';
import type { BarberContextType } from '../types';
import { MOCK_EARNINGS_DATA, TODAY_APPOINTMENTS } from '../constants/mockData';

interface DashboardPageProps {
  context: BarberContextType;
}

const getTodayIndex = () => {
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/80 text-white p-2 rounded-md shadow-lg text-sm backdrop-blur-sm">
        <p className="font-bold">{`${label}`}</p>
        <p>{`درآمد: ${payload[0].value.toLocaleString('fa-IR')} تومان`}</p>
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ context }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  const todayIndex = getTodayIndex();
  const todayIncome = MOCK_EARNINGS_DATA[todayIndex]?.درآمد || 0;

  const handleCustomerSelect = (customerId: number) => {
    const customer = TODAY_APPOINTMENTS.find(apt => apt.customerId === customerId);
    if (customer) {
      context.setSelectedCustomer?.(customer as any);
      context.setCurrentPage('customers', { customerId });
    }
  };

  return (
    <div className="flex flex-col bg-surface-1 h-full overflow-y-auto">
      <header className="sticky top-0 flex-shrink-0 bg-surface-1/80 backdrop-blur-sm z-40 p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={context.user?.avatarUrl || "https://picsum.photos/id/1027/100/100"} alt="آواتار" className="w-12 h-12 rounded-full border-2 border-primary-600" />
          <div>
            <p className="text-sm text-gray-700">صبح بخیر! 👋</p>
            <h1 className="font-bold text-lg text-black">{context.user?.name || 'سالن زیبایی شما'}</h1>
          </div>
        </div>
        <button onClick={() => context.setCurrentPage('notifications')} className="relative p-2 rounded-full bg-white border border-gray-200" aria-label="اعلانات">
            <Bell className="w-6 h-6 text-gray-900" />
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-error-500 ring-2 ring-white"></span>
        </button>
      </header>

      <main className="flex-grow p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InsightCard icon={Users} title="مشتریان" value="124" change="+12%" changeType="up" />
            <InsightCard icon={Calendar} title="رزروهای فعال" value="5" subtext="در انتظار" />
            <div className="col-span-2">
                <IncomeCard todayIncome={todayIncome} todayIndex={todayIndex} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">نوبت‌های امروز شما</h2>
              <button onClick={() => context.setCurrentPage('appointments')} className="text-sm font-semibold text-primary-600">مشاهده همه</button>
            </div>
            <div className="space-y-3">
              {TODAY_APPOINTMENTS.map((appt) => (
                <CustomerCard key={appt.id} {...appt} onClick={() => handleCustomerSelect(appt.customerId || appt.id)} />
              ))}
              {TODAY_APPOINTMENTS.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <p className="text-gray-700">امروز نوبت رزرو شده‌ای ندارید.</p>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
};

interface InsightCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down';
    subtext?: string;
}
const InsightCard: React.FC<InsightCardProps> = ({ icon: Icon, title, value, change, changeType, subtext }) => (
    <div className="bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-lg shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-600">
            <span className="text-sm font-medium">{title}</span>
            <Icon className="w-5 h-5"/>
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
                <p className={`text-xs ${changeType === 'up' ? 'text-success-600' : 'text-error-600'}`}>
                    {change} نسبت به دوره قبل
                </p>
            )}
            {subtext && <p className="text-xs text-gray-700">{subtext}</p>}
        </div>
    </div>
);

const IncomeCard: React.FC<{ todayIncome: number, todayIndex: number }> = ({ todayIncome, todayIndex }) => (
    <div className="bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-lg shadow-xs h-full">
         <div className="flex items-center justify-between text-gray-600">
            <span className="text-sm font-medium">درآمد امروز</span>
            <DollarSign className="w-5 h-5"/>
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{todayIncome.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span></p>
        </div>
        <div className="h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={MOCK_EARNINGS_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 12, fill: '#6B7280', dy: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(23, 102, 169, 0.1)' }} />
                    <Bar dataKey="درآمد" radius={[4, 4, 0, 0]}>
                         {MOCK_EARNINGS_DATA.map((entry, index) => (
                            <Cell cursor="pointer" fill={index === todayIndex ? '#145694' : '#A0C8F0'} key={`cell-${index}`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

interface CustomerCardProps {
    id: number;
    name: string;
    service: string;
    time: string;
    price?: string;
    avatar: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    onClick: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ name, service, time, price, avatar, status, onClick }) => {
    const statusInfo = {
        confirmed: { text: 'تایید شده', color: 'bg-success-100 text-success-700'},
        pending: { text: 'در انتظار', color: 'bg-warning-100 text-warning-700'},
        cancelled: { text: 'لغو شده', color: 'bg-error-100 text-error-700'},
    };

    return (
        <button onClick={onClick} className="w-full text-right bg-white p-4 rounded-lg border border-gray-200 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-bold">{name}</p>
                        <p className="text-sm text-gray-700">{service}</p>
                    </div>
                </div>
                <div className="text-left">
                     <p className="font-semibold">{time}</p>
                     {price && <p className="text-xs text-gray-700">{price} تومان</p>}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo[status].color}`}>
                    {statusInfo[status].text}
                </span>
                <ChevronLeft size={20} className="text-gray-600" />
            </div>
        </button>
    )
}
