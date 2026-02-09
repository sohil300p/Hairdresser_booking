import type { Barber, Service, Booking, Transaction, Notification, Discount, User, BankCard } from './types';
import { BookingStatus } from './types';

export const SERVICES: Service[] = [
  { id: 1, name: 'کوتاهی مو', duration: 30, price: 150000 },
  { id: 2, name: 'اصلاح صورت', duration: 20, price: 80000 },
  { id: 3, name: 'رنگ مو', duration: 90, price: 450000 },
  { id: 4, name: 'کراتینه', duration: 120, price: 1200000 },
  { id: 5, name: 'پاکسازی پوست', duration: 45, price: 250000 },
];

export const BARBERS: Barber[] = [
  {
    id: 1,
    name: 'آرایشگاه VIP مدرن',
    avatarUrl: 'https://picsum.photos/seed/barber1/200/200',
    rating: 4.8,
    reviewCount: 125,
    distance: 1.2,
    priceRange: [80000, 1200000],
    isVerified: true,
    isOpen: true,
    discount: '۲۰٪ تخفیف',
    gallery: [
      'https://picsum.photos/seed/gal1/400/300',
      'https://picsum.photos/seed/gal2/400/300',
      'https://picsum.photos/seed/gal3/400/300',
      'https://picsum.photos/seed/gal4/400/300',
    ],
    services: [SERVICES[0], SERVICES[1], SERVICES[3]],
    reviews: [
      { id: 1, author: 'علی رضایی', rating: 5, comment: 'عالی بود، کارشون حرف نداره!', date: '۲ روز پیش' },
      { id: 2, author: 'محمد حسینی', rating: 4, comment: 'محیط تمیز و برخورد خوب.', date: '۱ هفته پیش' },
    ],
    about: 'آرایشگاه مدرن با بهترین تجهیزات روز دنیا. متخصص در کوتاهی‌های مدرن و کراتینه. ما به زیبایی شما اهمیت می‌دهیم.',
    location: { lat: 35.72, lng: 51.42 }
  },
  {
    id: 2,
    name: 'پیرایشگاه کلاسیک',
    avatarUrl: 'https://picsum.photos/seed/barber2/200/200',
    rating: 4.5,
    reviewCount: 88,
    distance: 2.5,
    priceRange: [150000, 450000],
    isVerified: false,
    isOpen: false,
    gallery: [
      'https://picsum.photos/seed/gal5/400/300',
      'https://picsum.photos/seed/gal6/400/300',
    ],
    services: [SERVICES[0], SERVICES[2]],
     reviews: [
      { id: 1, author: 'سینا احمدی', rating: 5, comment: 'همیشه برای کوتاهی میام اینجا. راضی‌ام.', date: 'دیروز' },
    ],
    about: 'پیرایشگاه کلاسیک با سابقه‌ای درخشان. بهترین مکان برای یک اصلاح صورت حرفه‌ای و کوتاهی کلاسیک.',
    location: { lat: 35.70, lng: 51.40 }
  },
  {
    id: 3,
    name: 'سالن زیبایی موآرا',
    avatarUrl: 'https://picsum.photos/seed/barber3/200/200',
    rating: 4.9,
    reviewCount: 210,
    distance: 0.8,
    priceRange: [250000, 1200000],
    isVerified: true,
    isOpen: true,
    gallery: [
      'https://picsum.photos/seed/gal7/400/300',
      'https://picsum.photos/seed/gal8/400/300',
      'https://picsum.photos/seed/gal9/400/300',
    ],
    services: [SERVICES[2], SERVICES[3], SERVICES[4]],
    reviews: [
      { id: 1, author: 'زهرا محمدی', rating: 5, comment: 'کار رنگ موشون فوق‌العاده‌ست!', date: '۵ روز پیش' },
    ],
    about: 'متخصصان زیبایی موآرا با جدیدترین متدهای رنگ و لایت و پاکسازی پوست در خدمت شما هستند.',
    location: { lat: 35.71, lng: 51.39 }
  },
];

export const BOOKINGS: Booking[] = [
    { id: 'b1', barber: BARBERS[0], service: SERVICES[0], date: '1403/05/10', time: '14:30', status: BookingStatus.Confirmed, price: 150000 },
    { id: 'b2', barber: BARBERS[2], service: SERVICES[4], date: '1403/05/12', time: '11:00', status: BookingStatus.Completed, price: 250000 },
    { id: 'b3', barber: BARBERS[1], service: SERVICES[1], date: '1403/04/20', time: '17:00', status: BookingStatus.Canceled, price: 80000 },
];

export const TRANSACTIONS: Transaction[] = [
    { id: 't1', booking: BOOKINGS[1], amount: 250000, date: '1403/05/12', status: 'موفق' },
    { id: 't2', booking: BOOKINGS[0], amount: 150000, date: '1403/05/10', status: 'موفق' },
];

export const NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'رزرو تایید شد', message: 'رزرو شما در آرایشگاه VIP مدرن برای کوتاهی مو تایید شد.', date: 'دیروز', isRead: false },
    { id: 'n2', title: 'یادآوری رزرو', message: 'فراموش نکنید، فردا ساعت ۱۱:۰۰ در سالن زیبایی موآرا قرار دارید.', date: '۲ روز پیش', isRead: true },
    { id: 'n3', title: 'تخفیف ویژه', message: 'تا ۳۰٪ تخفیf برای خدمات کراتینه! همین حالا رزرو کنید.', date: '۱ هفته پیش', isRead: true },
];

export const DISCOUNTS: Discount[] = [
    { id: 'd1', code: 'TAKHFIF20', description: '۲۰٪ تخفیف ویژه اولین خرید', value: 20 },
    { id: 'd2', code: 'KERATIN', description: '۵۰ هزار تومان تخفیف کراتینه', value: 50000 },
];

export const LOGGED_IN_USER: User = {
    name: 'علی رضایی',
    phone: '09123456789',
    walletBalance: 25000,
    bankCards: [
        { id: 'c1', last4: '6037', bankName: 'بانک ملی', isVerified: true }
    ],
};

export const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];