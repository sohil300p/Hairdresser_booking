import React, { useState } from 'react';
import type { AppContextType, Service, Barber } from '../types';
import { Icon, IconName } from '../components/Icon';
import { Button } from '../components/Button';
import { SERVICES } from '../constants';

interface BarberProfilePageProps {
  context: AppContextType;
}

export const BarberProfilePage: React.FC<BarberProfilePageProps> = ({ context }) => {
  const { selectedBarber: barber, toggleFavorite, favorites } = context;
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews' | 'gallery'>('services');

  if (!barber) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p>آرایشگاه مورد نظر یافت نشد.</p>
        <Button onClick={() => context.setCurrentPage('home')}>بازگشت به خانه</Button>
      </div>
    );
  }
  
  const isFavorite = favorites.includes(barber.id);

  const handleServiceSelect = (service: Service) => {
    context.setCurrentPage('booking', { barber, service });
  };
  
  const ActionButton: React.FC<{ icon: IconName, label: string, onClick?: () => void, isActive?: boolean }> = ({ icon, label, onClick, isActive }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-colors w-16 ${isActive ? 'text-[var(--md-sys-color-primary)]' : 'text-gray-700 hover:text-[var(--md-sys-color-primary)]'}`}>
        <div className={`p-3.5 bg-gray-100 rounded-full transition-colors ${isActive ? 'bg-[var(--md-sys-color-primary-container)]' : 'hover:bg-gray-200'}`}>
            <Icon name={icon} className={`w-6 h-6 ${isActive && icon === 'save' ? 'fill-current' : ''}`}/>
        </div>
        <span className="text-xs font-semibold">{label}</span>
    </button>
  );

  const TabButton: React.FC<{ tab: 'services' | 'about' | 'reviews' | 'gallery', label: string }> = ({ tab, label }) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 font-semibold transition-colors w-full ${activeTab === tab ? 'text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)]' : 'text-gray-500'}`}
      >
        {label}
      </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <div className="relative">
        <header className="h-56">
          <img src={barber.gallery[0] || barber.avatarUrl} alt="gallery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10"></div>
          <button onClick={() => context.setCurrentPage('home')} className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm rounded-full p-2 shadow-md z-10 transition-transform active:scale-90">
              <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
          </button>
        </header>
        
        <div className="bg-white p-4 -mt-16 mx-4 rounded-t-2xl shadow-lg relative z-10">
           <h1 className="text-2xl font-bold text-right text-[var(--md-sys-color-on-surface)]">{barber.name}</h1>
           <div className="flex items-center justify-end mt-2 text-sm text-gray-500">
              <span className="ml-1">{barber.rating.toFixed(1)}</span>
              <Icon name="star" className="w-4 h-4 text-yellow-500" />
              <span className="mx-2">|</span>
              <span>({barber.reviewCount} نظر)</span>
              <span className="mx-2">|</span>
              <span>{barber.distance.toFixed(1)} کیلومتر</span>
           </div>
           <div className="border-t my-4"></div>
           <div className="flex justify-around items-center">
              <ActionButton icon="location" label="مسیر" />
              <ActionButton icon="chatBubble" label="گفتگو" onClick={() => context.setCurrentPage('chat', { barber })} />
              <ActionButton icon="save" label={isFavorite ? 'ذخیره شد' : 'ذخیره'} onClick={() => toggleFavorite(barber.id)} isActive={isFavorite}/>
            </div>
        </div>
      </div>
      
      <div className="sticky top-0 bg-gray-50 z-10 mt-4 border-b border-gray-200">
        <nav className="flex justify-around bg-white">
            <TabButton tab="services" label="خدمات" />
            <TabButton tab="about" label="درباره" />
            <TabButton tab="reviews" label="نظرات" />
            <TabButton tab="gallery" label="گالری" />
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'services' && (
            <div className="space-y-3">
                {barber.services.length > 0 ? (
                    barber.services.map(service => (
                        <div key={service.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                            <div>
                                <p className="font-semibold text-right">{service.name}</p>
                                <p className="text-sm text-gray-500 text-right">{service.duration} دقیقه - {Number(service.price).toLocaleString('en-US')} تومان</p>
                            </div>
                            <button onClick={() => handleServiceSelect(service)} className="bg-[var(--md-sys-color-primary)] text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-transform active:scale-95">
                               رزرو
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">خدماتی ثبت نشده است</div>
                )}
            </div>
        )}
        {activeTab === 'about' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
                <p className="text-gray-700 leading-relaxed">{barber.about}</p>
            </div>
        )}
         {activeTab === 'gallery' && (
            <div className="grid grid-cols-2 gap-2">
                {barber.gallery.length > 0 ? (
                    barber.gallery.map((img, index) => (
                        <img key={index} src={img} alt={`gallery ${index}`} className="w-full h-32 object-cover rounded-md" />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">گالری خالی است</div>
                )}
            </div>
        )}
        {activeTab === 'reviews' && (
             <div className="space-y-3 text-right">
                {barber.reviews.length > 0 ? (
                    barber.reviews.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                                <p className="font-bold">{review.author}</p>
                                <div className="flex items-center text-sm text-yellow-500">
                                    <span className="ml-1">{review.rating}</span>
                                    <Icon name="star" className="w-4 h-4 fill-current"/>
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs my-1">{review.date}</p>
                            <p className="text-gray-700">{review.comment}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">نظری ثبت نشده است</div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
