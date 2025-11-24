import React, { useMemo } from 'react';
import Mapir from 'mapir-react-component';
import 'mapir-react-component/dist/index.css';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title?: string;
  data?: any;
}

export interface MapProps {
  markers?: MapMarker[];
  selectedMarkerId?: string | number | null;
  onMarkerClick?: (marker: MapMarker) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string | number;
  className?: string;
  showControls?: boolean;
  showZoomControl?: boolean;
  showScaleControl?: boolean;
  showRotationControl?: boolean;
}

const DEFAULT_CENTER = { lat: 35.6892, lng: 51.389 }; // Tehran
const DEFAULT_MARKER_IMAGE = 'https://map.ir/css/images/marker-default-red.svg';
const SELECTED_MARKER_IMAGE = 'https://map.ir/css/images/marker-default-blue.svg';

export const Map: React.FC<MapProps> = ({
  markers = [],
  selectedMarkerId = null,
  onMarkerClick,
  center,
  zoom = 12,
  height = '500px',
  className = '',
  showControls = true,
  showZoomControl = true,
  showScaleControl = true,
  showRotationControl = false,
}) => {
  const apiKey = import.meta.env.VITE_MAPIR_API_KEY ?? '';

  const mapInstance = useMemo(() => {
    if (!apiKey) return null;

    return Mapir.setToken({
      transformRequest: (url: string) => ({
        url,
        headers: {
          'x-api-key': apiKey,
          'Mapir-SDK': 'reactjs',
        },
      }),
    });
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div
        className={`bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="mb-2">نقشه در دسترس نیست</p>
          <p className="text-sm">لطفا API Key نقشه را تنظیم کنید</p>
        </div>
      </div>
    );
  }

  if (!mapInstance) {
    return (
      <div
        className={`bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 ${className}`}
        style={{ height }}
      >
        <div>در حال بارگذاری نقشه...</div>
      </div>
    );
  }

  const effectiveCenter = center
    ?? (markers.length
      ? {
          lat: markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length,
          lng: markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length,
        }
      : DEFAULT_CENTER);

  const markerList: MapMarker[] = markers.length
    ? markers
    : [
        {
          id: 'tehran-default',
          lat: effectiveCenter.lat,
          lng: effectiveCenter.lng,
          title: 'تهران',
        },
      ];

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <Mapir
        Map={mapInstance}
        center={[effectiveCenter.lng, effectiveCenter.lat]}
        zoom={[zoom]}
        style={{ width: '100%', height: '100%' }}
      />
      {markerList.map((marker) => (
        <Mapir.Marker
          key={marker.id}
          coordinates={[marker.lng, marker.lat]}
          anchor="bottom"
          Image={selectedMarkerId === marker.id ? SELECTED_MARKER_IMAGE : DEFAULT_MARKER_IMAGE}
          onClick={() => onMarkerClick?.(marker)}
        />
      ))}
    </div>
  );
};

