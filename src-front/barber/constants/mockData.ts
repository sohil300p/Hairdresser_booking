import type { Appointment, Customer, Service, Schedule, EarningsData } from '../types';

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, name: 'احمد رضایی', service: 'اصلاح مو + ریش', time: '14:30', avatar: 'https://picsum.photos/id/1005/100/100', status: 'confirmed', date: '1403/05/10', price: '150,000', customerId: 1 },
  { id: 2, name: 'حسن محمدی', service: 'اصلاح مو', time: '16:00', avatar: 'https://picsum.photos/id/1006/100/100', status: 'pending', date: '1403/05/10', price: '100,000', customerId: 2 },
  { id: 3, name: 'علی اکبری', service: 'کراتینه', time: '17:30', avatar: 'https://picsum.photos/id/1008/100/100', status: 'confirmed', date: '1403/05/11', price: '450,000', customerId: 3 },
  { id: 4, name: 'مریم قاسمی', service: 'رنگ مو', time: '11:00', avatar: 'https://picsum.photos/id/1011/100/100', status: 'cancelled', date: '1403/05/12', price: '300,000', customerId: 4 },
  { id: 5, name: 'سارا نادری', service: 'اصلاح صورت', time: '12:00', avatar: 'https://picsum.photos/id/1012/100/100', status: 'pending', date: '1403/05/12', price: '80,000', customerId: 5 },
  { id: 6, name: 'رضا حسینی', service: 'اصلاح مو', time: '19:00', avatar: 'https://picsum.photos/id/1013/100/100', status: 'pending', date: '1403/05/20', price: '100,000', customerId: 6 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: 1, 
    name: 'احمد رضایی', 
    phone: '09123456789', 
    avatar: 'https://picsum.photos/id/1005/100/100', 
    points: 150, 
    history: [
      { id: 1, type: 'earn', points: 50, description: 'اصلاح مو', date: '۱۴۰۳/۰۴/۲۰' },
      { id: 2, type: 'earn', points: 100, description: 'اصلاح مو + ریش', date: '۱۴۰۳/۰۵/۱۰' },
    ]
  },
  { 
    id: 2, 
    name: 'حسن محمدی', 
    phone: '09121112233', 
    avatar: 'https://picsum.photos/id/1006/100/100', 
    points: 30, 
    history: [
      { id: 1, type: 'earn', points: 50, description: 'اصلاح مو', date: '۱۴۰۳/۰۵/۰۱' },
      { id: 2, type: 'redeem', points: 20, description: 'تخفیف', date: '۱۴۰۳/۰۵/۰۱' },
    ]
  },
  { 
    id: 3, 
    name: 'علی اکبری', 
    phone: '09355554433', 
    avatar: 'https://picsum.photos/id/1008/100/100', 
    points: 250, 
    history: [
      { id: 1, type: 'earn', points: 250, description: 'کراتینه', date: '۱۴۰۳/۰۵/۱۱' },
    ]
  },
  { 
    id: 4, 
    name: 'مریم قاسمی', 
    phone: '09109876543', 
    avatar: 'https://picsum.photos/id/1011/100/100', 
    points: 0, 
    history: []
  },
  { 
    id: 5, 
    name: 'سارا نادری', 
    phone: '09331231231', 
    avatar: 'https://picsum.photos/id/1012/100/100', 
    points: 80, 
    history: [
      { id: 1, type: 'earn', points: 80, description: 'اصلاح صورت', date: '۱۴۰۳/۰۵/۱۲' },
    ]
  },
];

export const MOCK_SERVICES: Service[] = [
  { id: 1, name: 'کوتاهی مو', duration: 30, price: 150000, description: 'کوتاهی مو با تکنیک‌های مدرن', isActive: true },
  { id: 2, name: 'اصلاح صورت', duration: 20, price: 80000, description: 'اصلاح صورت حرفه‌ای', isActive: true },
  { id: 3, name: 'رنگ مو', duration: 90, price: 450000, description: 'رنگ مو با بهترین مواد', isActive: true },
  { id: 4, name: 'کراتینه', duration: 120, price: 1200000, description: 'کراتینه مو برای موهای صاف و براق', isActive: true },
  { id: 5, name: 'پاکسازی پوست', duration: 45, price: 250000, description: 'پاکسازی عمیق پوست صورت', isActive: true },
];

export const MOCK_SCHEDULE: Schedule[] = [
  { key: 'saturday', name: 'شنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'sunday', name: 'یکشنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'monday', name: 'دوشنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'tuesday', name: 'سه‌شنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'wednesday', name: 'چهارشنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'thursday', name: 'پنج‌شنبه', isActive: true, startTime: '09:00', endTime: '20:00' },
  { key: 'friday', name: 'جمعه', isActive: false, startTime: '09:00', endTime: '20:00' },
];

export const MOCK_EARNINGS_DATA: EarningsData[] = [
  { name: 'شنبه', درآمد: 400000 },
  { name: '۱شنبه', درآمد: 300000 },
  { name: '۲شنبه', درآمد: 600000 },
  { name: '۳شنبه', درآمد: 280000 },
  { name: '۴شنبه', درآمد: 500000 },
  { name: '۵شنبه', درآمد: 450000 },
  { name: 'جمعه', درآمد: 100000 },
];

export const TODAY_APPOINTMENTS = MOCK_APPOINTMENTS.filter(apt => apt.date === '1403/05/10');

