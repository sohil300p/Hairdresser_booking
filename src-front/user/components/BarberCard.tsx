import React from 'react';
import type { Barber } from '../types';
import { Icon } from './Icon';

interface BarberCardProps {
  barber: Barber;
  onClick: () => void;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export const BarberCard: React.FC<BarberCardProps> = ({ barber, onClick, isFavorite, onFavoriteToggle }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 cursor-pointer transition-all duration-300 ease-in-out active:scale-[0.98] hover:border-gray-300 relative"
    >
       <button 
        onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
        className="absolute top-2 left-2 bg-white/70 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:text-[var(--md-sys-color-primary)] z-10 transition-colors"
        aria-label="ذخیره کردن آرایشگاه"
        >
        <Icon name="save" className={`w-6 h-6 ${isFavorite ? 'fill-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]' : ''}`} />
      </button>

      {barber.discount && (
        <div className="absolute top-3 right-3 bg-[var(--md-sys-color-error)] text-white text-xs font-bold px-2 py-1 rounded-md z-10">
          {barber.discount}
        </div>
      )}

      <div className="relative">
        <img src={barber.gallery[0] || barber.avatarUrl} alt={barber.name} className="w-full h-32 object-cover" />
        <img 
          src={barber.avatarUrl} 
          alt={`${barber.name} avatar`} 
          className="absolute bottom-0 right-4 transform translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover" 
        />
        <div className={`absolute bottom-2 left-3 text-xs font-bold px-2 py-1 rounded-full text-white ${barber.isOpen ? 'bg-[var(--md-sys-color-tertiary)]' : 'bg-gray-500'}`}>
          {barber.isOpen ? 'باز است' : 'بسته است'}
        </div>
      </div>

      <div className="p-4 pt-10 text-right">
        <h3 className="font-bold text-xl text-[var(--md-sys-color-on-surface)] truncate">{barber.name}</h3>

        <div className="flex items-center justify-between mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <div className="flex items-center">
                <Icon name="location" className="w-4 h-4 text-gray-400 ml-1" />
                <span>{barber.distance} کیلومتر</span>
            </div>
            <div className="flex items-center">
                <span className="ml-1 font-bold text-[var(--md-sys-color-on-surface)]">{barber.rating.toFixed(1)}</span>
                <Icon name="star" className="w-4 h-4 text-yellow-500" />
                <span className="mr-2">({barber.reviewCount} نظر)</span>
            </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
          <span>شروع قیمت از </span>
          <span className="font-semibold text-gray-800 font-mono">{Number(barber.priceRange[0]).toLocaleString('en-US')}</span>
          <span className="font-sans"> تومان</span>
        </div>
      </div>
    </div>
  );
};