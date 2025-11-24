import React from 'react';
import type { UserContextType } from '../types';
import type { Barber } from '../../shared/types/common';
import { Icon } from '../../shared/components/Icon';
import { BarberCard } from '../components/BarberCard';

interface FavoritesPageProps {
  context: UserContextType;
  barbers: Barber[];
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ context, barbers }) => {
  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-10 flex items-center p-4 mb-4">
        <button onClick={() => context.setCurrentPage('profile')} className="absolute right-0">
          <Icon name="chevronRight" className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-center w-full text-[var(--text-primary)]">ذخیره شده‌ها</h1>
      </header>

      <div className="px-4">
        {barbers.length > 0 ? (
          barbers.map(barber => (
            <BarberCard
              key={barber.id}
              barber={barber}
              onClick={() => context.setCurrentPage('barber', { barber })}
              isFavorite={context.favorites.includes(barber.id)}
              onFavoriteToggle={() => context.toggleFavorite(barber.id)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-12">
            هنوز هیچ آرایشگاهی را ذخیره نکرده‌اید.
          </p>
        )}
      </div>
    </div>
  );
};