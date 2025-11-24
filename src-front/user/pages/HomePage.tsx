import React, { useState, useMemo, useEffect } from 'react';
import type { UserContextType } from '../types';
import type { Barber } from '../../shared/types/common';
import { BARBERS, SERVICES, MAPIR_API_KEY } from '../constants';
import { BarberCard } from '../components/BarberCard';
import { Map, type MapMarker } from '../components/Map';
import { Icon } from '../../shared/components/Icon';
import { barberService } from '../services/barber.service';

type SortType = 'distance' | 'rating' | 'price_asc';
type ViewMode = 'list' | 'map';

export const HomePage: React.FC<{ context: UserContextType }> = ({ context }) => {
  const [sortType, setSortType] = useState<SortType>('distance');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBarberOnMap, setSelectedBarberOnMap] = useState<Barber | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>(BARBERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const result = await barberService.getBarbers();
        if (result.success && result.data) {
          // Transform API barbers to frontend Barber type
          const transformedBarbers: Barber[] = result.data.map((apiBarber, index) => ({
            id: apiBarber.id,
            name: apiBarber.name,
            avatarUrl: apiBarber.profileImage || `https://picsum.photos/seed/barber${apiBarber.id}/200/200`,
            rating: apiBarber.rating || 0,
            reviewCount: 0, // TODO: Add review count to API
            distance: apiBarber.distance || Math.random() * 5, // Mock distance until location is added
            priceRange: [80000, 1200000] as [number, number], // TODO: Add price range to API
            isVerified: true, // TODO: Add verification status to API
            isOpen: true, // TODO: Add open status to API
            discount: index === 0 ? '۲۰٪ تخفیف' : undefined,
            gallery: [
              `https://picsum.photos/seed/gal${apiBarber.id}1/400/300`,
              `https://picsum.photos/seed/gal${apiBarber.id}2/400/300`,
            ], // TODO: Add gallery to API
            services: SERVICES.slice(0, 3), // TODO: Add services to API
            reviews: [], // TODO: Add reviews to API
            about: apiBarber.bio || 'آرایشگاه با تجربه و تخصص بالا',
            location: { lat: 35.72 + Math.random() * 0.1, lng: 51.42 + Math.random() * 0.1 }, // Mock location
          }));
          setBarbers(transformedBarbers);
        }
      } catch (error) {
        console.error('Error fetching barbers:', error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  const unreadCount = useMemo(() => context.notifications.filter(n => !n.isRead).length, [context.notifications]);

  const sortedBarbers = useMemo(() => {
    const barbersCopy = [...barbers];
    switch (sortType) {
      case 'rating':
        return barbersCopy.sort((a, b) => b.rating - a.rating);
      case 'price_asc':
        return barbersCopy.sort((a, b) => a.priceRange[0] - b.priceRange[0]);
      case 'distance':
      default:
        return barbersCopy.sort((a, b) => a.distance - b.distance);
    }
  }, [sortType, barbers]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return sortedBarbers.map((barber) => ({
      id: barber.id,
      lat: barber.location.lat,
      lng: barber.location.lng,
      title: barber.name,
      data: barber,
    }));
  }, [sortedBarbers]);

  const mapCenter = useMemo(() => {
    if (sortedBarbers.length === 0) {
      return { lat: 35.6892, lng: 51.3890 };
    }
    const avgLat = sortedBarbers.reduce((sum, b) => sum + b.location.lat, 0) / sortedBarbers.length;
    const avgLng = sortedBarbers.reduce((sum, b) => sum + b.location.lng, 0) / sortedBarbers.length;
    return { lat: avgLat, lng: avgLng };
  }, [sortedBarbers]);

  useEffect(() => {
    if (viewMode === 'map' && !selectedBarberOnMap && sortedBarbers.length > 0) {
      setSelectedBarberOnMap(sortedBarbers[0]);
    }
  }, [viewMode, selectedBarberOnMap, sortedBarbers]);
  
  const handleBarberClick = (barber: Barber) => {
    context.setCurrentPage('barber', { barber });
  };

  const handleMarkerClick = (marker: MapMarker) => {
    const barber = marker.data as Barber;
    if (barber) {
      setSelectedBarberOnMap(barber);
    }
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
            <div className="mb-4 h-[calc(100vh-350px)] relative">
                 <Map
                   markers={mapMarkers}
                   selectedMarkerId={selectedBarberOnMap?.id || null}
                   onMarkerClick={handleMarkerClick}
                   center={mapCenter}
                   zoom={12}
                   height="100%"
                   className="rounded-lg"
                 />
                 
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
                {loading ? (
                    <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
                ) : sortedBarbers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">آرایشگاهی یافت نشد</div>
                ) : (
                    sortedBarbers.map(barber => (
                        <BarberCard 
                            key={barber.id} 
                            barber={barber} 
                            onClick={() => handleBarberClick(barber)}
                            isFavorite={context.favorites.includes(barber.id)}
                            onFavoriteToggle={() => context.toggleFavorite(barber.id)}
                        />
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
};