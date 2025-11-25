

import React, { useState } from 'react';
import { ArrowRight, Save, X } from 'lucide-react';
import MaterialInput from './MaterialInput';
import BottomSheet from './BottomSheet';
// Import the shared Screen type from App.tsx instead of redeclaring it here.
import type { Screen } from '../App';

// Remove the local Screen type definition; it is now imported from App.tsx.

interface AddReservationScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const services = [
  { id: 1, name: 'اصلاح مو', price: '100,000 تومان' },
  { id: 2, name: 'اصلاح مو + ریش', price: '150,000 تومان' },
  { id: 3, name: 'کراتینه', price: '800,000 تومان' },
  { id: 4, name: 'رنگ مو', price: '450,000 تومان' },
  { id: 5, name: 'اصلاح صورت', price: '80,000 تومان' },
];

const AddReservationScreen: React.FC<AddReservationScreenProps> = ({ setActiveScreen }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('1403/05/15');
  const [time, setTime] = useState('15:30');
  const [isServiceSheetOpen, setServiceSheetOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.showToast('رزرو با موفقیت ثبت شد!', 'success');
    setActiveScreen('reservations');
  };
  
  const handleServiceSelect = (serviceName: string) => {
    setService(serviceName);
    setServiceSheetOpen(false);
  };

  return (
    <>
      <div className="absolute inset-0 bg-surface-1 z-40 flex flex-col">
        <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 flex items-center gap-4 border-b border-gray-200">
            <button onClick={() => setActiveScreen('reservations')} aria-label="بازگشت"><ArrowRight /></button>
            <h1 className="text-2xl font-bold">افزودن رزرو دستی</h1>
        </header>

        <main className="flex-grow p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <MaterialInput 
              id="customerName" 
              label="نام مشتری" 
              type="text" 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              required 
            />
            <MaterialInput 
              id="customerPhone" 
              label="شماره تماس مشتری" 
              type="tel"
              value={customerPhone} 
              onChange={e => setCustomerPhone(e.target.value)} 
              required 
            />
            <div className="relative">
                <MaterialInput 
                  id="service" 
                  label="خدمت" 
                  type="text" 
                  value={service}
                  onClick={() => setServiceSheetOpen(true)}
                  readOnly
                  required
                  className="cursor-pointer"
                />
                 <div className="absolute top-0 left-0 h-full flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <MaterialInput 
                  id="date" 
                  label="تاریخ" 
                  type="text" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
                <MaterialInput 
                  id="time" 
                  label="ساعت" 
                  type="text" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                />
            </div>
          </form>
        </main>
        
        <footer className="p-4 border-t border-gray-200 flex gap-2" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
             <button type="button" onClick={() => setActiveScreen('reservations')} className="flex-1 h-12 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md font-semibold transition hover:bg-gray-300">
                <X size={18} /> لغو
            </button>
            <button onClick={handleSubmit} type="submit" className="flex-1 h-12 flex items-center justify-center gap-1 bg-primary-600 text-white font-bold rounded-md transition hover:bg-primary-700">
                <Save size={18} /> ثبت رزرو
            </button>
        </footer>
      </div>

      <BottomSheet isOpen={isServiceSheetOpen} onClose={() => setServiceSheetOpen(false)} title="انتخاب خدمت">
        <div className="space-y-2">
            {services.map(s => (
                <button 
                    key={s.id} 
                    onClick={() => handleServiceSelect(s.name)}
                    className="w-full text-right p-4 bg-surface-1 rounded-lg hover:bg-primary-100 hover:text-primary-700 transition"
                >
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-gray-600">{s.price}</p>
                </button>
            ))}
        </div>
      </BottomSheet>
    </>
  );
};

export default AddReservationScreen;
