

import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, User } from 'lucide-react';
import type { Screen } from '../App';
import { api } from '../utils/api';
import type { GetCommentsResponse } from '../types/api';

interface Review {
    id: number;
    name: string;
    rating: number;
    date: string;
    text: string;
    service: string;
    avatar: string | null;
}

function formatCommentDate(ts: number): string {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 86400000) return 'امروز';
    if (diff < 172800000) return 'دیروز';
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} روز پیش`;
    if (diff < 2592000000) return `${Math.floor(diff / 604800000)} هفته پیش`;
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface CustomerReviewsScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const CustomerReviewsScreen: React.FC<CustomerReviewsScreenProps> = ({ setActiveScreen }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState('0');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchComments() {
            try {
                const res = await api.get<GetCommentsResponse>('/barber/comments');
                if (res.success && res.data) {
                    setReviews(res.data.comments.map(c => ({
                        id: c.id,
                        name: c.customerName || 'مشتری ناشناس',
                        rating: c.rate ?? 0,
                        date: formatCommentDate(c.createdAt),
                        text: c.comment || '',
                        service: c.serviceName || '-',
                        avatar: c.customerAvatar,
                    })));
                    setAverageRating(res.data.averageRating.toFixed(1));
                }
            } catch {
                setReviews([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchComments();
    }, []);

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
                {isLoading ? (
                    <div className="text-center py-16 text-gray-600">در حال بارگذاری...</div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map(review => (
                            <ReviewCard key={review.id} {...review} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

interface ReviewCardProps extends Review {}

const ReviewCard: React.FC<ReviewCardProps> = ({ name, rating, date, text, service, avatar }) => (
    <div className="bg-white p-4 rounded-lg border shadow-xs">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                {avatar ? (
                    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="bg-gray-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                )}
                <div>
                    <p className="font-bold text-sm">{name}</p>
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
