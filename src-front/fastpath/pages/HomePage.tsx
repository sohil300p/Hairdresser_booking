import React, { useState, useMemo } from 'react';
import type { AppContextType, Barber } from '../types';
import { BARBERS } from '../constants';
import { BarberCard } from '../components/BarberCard';
import { Icon } from '../components/Icon';

type SortType = 'distance' | 'rating' | 'price_asc';
type ViewMode = 'list' | 'map';

const MapMarker: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
  <div className={`transition-all duration-300 ${isSelected ? 'scale-125 z-20' : 'z-10'}`}>
    <div
      className={`rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white shadow-lg ${isSelected ? 'w-9 h-9 bg-[var(--md-sys-color-error)]' : 'w-7 h-7 bg-[var(--md-sys-color-primary)]'}`}
    >
      <Icon name="location" className="w-4 h-4 text-white" />
    </div>
    <div className={`mx-auto mt-1 w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-[var(--md-sys-color-error)]' : 'bg-[var(--md-sys-color-primary)]'}`} />
  </div>
);

export const HomePage: React.FC<{ context: AppContextType }> = ({ context }) => {
  const [sortType, setSortType] = useState<SortType>('distance');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBarberOnMap, setSelectedBarberOnMap] = useState<Barber | null>(null);

  const unreadCount = useMemo(() => context.notifications.filter(n => !n.isRead).length, [context.notifications]);

  const sortedBarbers = useMemo(() => {
    const barbersCopy = [...BARBERS];
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
      className={`px-3.5 py-1.5 text-sm rounded-lg transition-colors ${
        sortType === type ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold' : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-20 p-4 -mx-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <div>
            <p className="text-[var(--md-sys-color-on-surface-variant)]">خوش آمدید،</p>
            <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">{context.user?.name}</h1>
            </div>
            <div className="relative cursor-pointer" onClick={() => context.setCurrentPage('notifications')}>
            <Icon name="bell" className="w-8 h-8 text-gray-700" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 text-xs flex items-center justify-center rounded-full bg-[var(--md-sys-color-error)] text-white ring-2 ring-gray-50">
                {unreadCount}
                </span>
            )}
            </div>
        </div>
        
        <div className="relative cursor-pointer" onClick={() => context.setCurrentPage('search')}>
            <div className="w-full bg-white p-3 pr-10 border border-gray-200 rounded-xl flex items-center text-gray-500">
            جستجوی آرایشگاه یا خدمات...
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Icon name="search" className="w-5 h-5 text-gray-400"/>
            </div>
        </div>
      </header>
      
      <div className="p-4">
        <div className="flex justify-between items-center my-4">
            <h2 className="text-xl font-bold text-right text-[var(--md-sys-color-on-surface)]">آرایشگاه‌ها</h2>
            <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                <button onClick={() => setViewMode('list')} className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
                    <Icon name="list" className="w-5 h-5 text-gray-700" />
                </button>
                <button onClick={() => setViewMode('map')} className={`p-1 rounded-md ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}>
                    <Icon name="map" className="w-5 h-5 text-gray-700" />
                </button>
            </div>
        </div>
        
        <div className="flex gap-2 mb-4 flex-wrap">
            <SortButton type="distance" label="نزدیک‌ترین" />
            <SortButton type="rating" label="بالاترین امتیاز" />
            <SortButton type="price_asc" label="ارزان‌ترین" />
        </div>

        {viewMode === 'map' && (
            <div className="mb-4 h-[calc(100vh-350px)] bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 relative overflow-hidden">
                 <img src="https://storage.googleapis.com/maker-studio-project-media-prod/maps/static_map.png" className="w-full h-full object-cover" alt="Map"/>
                 {sortedBarbers.map(barber => {
                     const MAP_TOP_LAT = 35.73;
                     const MAP_LEFT_LNG = 51.37;
                     const LAT_SPAN = 0.045;
                     const LNG_SPAN = 0.09;
                     
                     const top = Math.max(5, Math.min(95, ((MAP_TOP_LAT - barber.location.lat) / LAT_SPAN) * 100));
                     const left = Math.max(5, Math.min(95, ((barber.location.lng - MAP_LEFT_LNG) / LNG_SPAN) * 100));
                     const isSelected = selectedBarberOnMap?.id === barber.id;

                     return (
                         <div 
                            key={barber.id} 
                            style={{ top: `${top}%`, left: `${left}%` }} 
                            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); setSelectedBarberOnMap(barber); }}
                          >
                             <MapMarker isSelected={isSelected} />
                         </div>
                     )
                 })}
                 
                 <div className={`absolute bottom-0 left-0 right-0 p-3 transition-transform duration-500 ease-in-out z-30 ${selectedBarberOnMap ? 'translate-y-0' : 'translate-y-full'}`}>
                    {selectedBarberOnMap && (
                      <BarberCard 
                        barber={selectedBarberOnMap}
                        onClick={() => handleBarberClick(selectedBarberOnMap)}
                        isFavorite={context.favorites.includes(selectedBarberOnMap.id)}
                        onFavoriteToggle={() => context.toggleFavorite(selectedBarberOnMap.id)}
                      />
                    )}
                 </div>
            </div>
        )}
        
        {viewMode === 'list' && (
            <div>
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
        )}
      </div>
    </div>
  );
};