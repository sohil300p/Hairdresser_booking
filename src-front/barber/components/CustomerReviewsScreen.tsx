

import React, { useState } from 'react';
import { ArrowRight, Star, ThumbsUp, ThumbsDown, User } from 'lucide-react';
// Import the shared Screen type from App.tsx instead of redefining it locally.
import type { Screen } from '../App';

interface Review {
    id: number;
    name: string;
    rating: number;
    date: string;
    text: string;
    service: string;
    likes: number;
    dislikes: number;
}

interface CustomerReviewsScreenProps {
  // Accept a navigation callback that adheres to the global Screen type.
  setActiveScreen: (screen: Screen) => void;
}

const initialReviews: Review[] = [
    { id: 1, name: 'علی احمدی', rating: 5, date: '۲ روز پیش', text: 'کارشون عالی و حرفه‌ایه، همیشه مشتریشون هستم. واقعا بهترین آرایشگاه منطقه هستن.', service: 'اصلاح مو + ریش', likes: 12, dislikes: 0 },
    { id: 2, name: 'سارا نادری', rating: 4, date: 'هفته پیش', text: 'محیط آروم و تمیزی دارن، فقط یکم زمان انتظار طولانی شد.', service: 'رنگ مو', likes: 8, dislikes: 1 },
    { id: 3, name: 'حسن محمدی', rating: 5, date: 'هفته پیش', text: 'برخورد پرسنل عالی بود و از نتیجه کار خیلی راضی بودم.', service: 'اصلاح مو', likes: 15, dislikes: 0 },
    { id: 4, name: 'مریم قاسمی', rating: 3, date: '۲ هفته پیش', text: 'قیمت‌هاشون یکم بالاست به نظرم.', service: 'اصلاح صورت', likes: 3, dislikes: 4 },
    { id: 5, name: 'رضا حسینی', rating: 5, date: '۱ ماه پیش', text: 'بی‌نظیر! بهترین تجربه‌ی اصلاحی که تا حالا داشتم.', service: 'کراتینه', likes: 10, dislikes: 0 },
];

const CustomerReviewsScreen: React.FC<CustomerReviewsScreenProps> = ({ setActiveScreen }) => {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);

    const averageRating = (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className="absolute inset-0 bg-surface-1 z-40 flex flex-col">
            <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-40 flex items-center gap-4 border-b border-gray-200">
                <button onClick={() => setActiveScreen('profile')} aria-label="بازگشت"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">نظرات مشتریان</h1>
            </header>

            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                <div className="bg-white p-4 rounded-lg border shadow-xs text-center">
                    <p className="text-sm text-gray-700">میانگین امتیازات</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-3xl font-bold">{averageRating}</p>
                        <Star size={24} className="text-accent-500 fill-current" />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">از مجموع {reviews.length} نظر</p>
                </div>
                <div className="space-y-3">
                    {reviews.map(review => (
                        <ReviewCard key={review.id} {...review} />
                    ))}
                </div>
            </main>
        </div>
    );
};

interface ReviewCardProps extends Review {}

const ReviewCard: React.FC<ReviewCardProps> = ({ id, rating, date, text, service, likes, dislikes }) => (
    <div className="bg-white p-4 rounded-lg border shadow-xs">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-gray-100 p-2 rounded-full">
                    <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                    <p className="font-bold text-sm">مشتری ناشناس</p>
                    <p className="text-xs text-gray-600">برای <span className="font-semibold text-primary-700">{service}</span></p>
                </div>
            </div>
            <div className="text-xs text-gray-600">{date}</div>
        </div>
        <div className="flex items-center gap-0.5 my-3" role="img" aria-label={`امتیاز: ${rating} از 5`}>
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < rating ? 'text-accent-500 fill-current' : 'text-gray-300'} />
            ))}
        </div>
        <p className="text-sm text-gray-800 leading-relaxed bg-surface-1 p-3 rounded-md">{text}</p>
    </div>
);


export default CustomerReviewsScreen;
