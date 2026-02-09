import React, { useState, useMemo } from 'react';
import type { AppContextType, Barber } from '../types';
import { BARBERS } from '../constants';
import { BarberCard } from '../components/BarberCard';
import { Icon } from '../components/Icon';

type SortType = 'distance' | 'rating' | 'price_asc';

export const SearchPage: React.FC<{ context: AppContextType }> = ({ context }) => {
   const [sortType, setSortType] = useState<SortType>('distance');

   const sortedBarbers = useMemo(() => {
    const barbersCopy = [...BARBERS];
    // In a real app, this would also be filtered by search term
    switch (sortType) {
      case 'rating':
        return barbersCopy.sort((a, b) => b.rating - a.rating);
      case 'price_asc':
        return barbersCopy.sort((a, b) => a.priceRange[0] - b.priceRange[0]);
      case 'distance':
      default:
        return barbersCopy.sort((a, b) => a.distance - b.distance);
    }
  }, [sortType]);
    
   const handleBarberClick = (barber: Barber) => {
    context.setCurrentPage('barber', { barber });
  };

  const SortButton: React.FC<{ type: SortType, label: string }> = ({ type, label }) => (
    <button
      onClick={() => setSortType(type)}
      className={`px-3 py-1 text-sm rounded-full transition-colors ${
        sortType === type ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
         <div className="relative flex-grow">
            <input
                type="text"
                placeholder="جستجوی آرایشگاه یا خدمات..."
                className="form-input pr-10"
                autoFocus
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Icon name="search" className="w-5 h-5 text-gray-400"/>
            </div>
        </div>
        <button onClick={() => context.setCurrentPage('home')} className="mr-3 text-[var(--primary)] font-semibold flex-shrink-0">
            لغو
        </button>
      </header>

      <div className="px-4">
        <div className="flex gap-2 mb-4">
          <SortButton type="distance" label="نزدیک‌ترین" />
          <SortButton type="rating" label="بالاترین امتیاز" />
          <SortButton type="price_asc" label="ارزان‌ترین" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-right text-[var(--text-primary)] mb-3">نتایج</h2>
          {sortedBarbers.map(barber => (
            <BarberCard
              key={barber.id}
              barber={barber}
              onClick={() => handleBarberClick(barber)}
              isFavorite={context.favorites.includes(barber.id)}
              onFavoriteToggle={() => context.toggleFavorite(barber.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};