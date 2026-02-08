/// <reference types="vite/client" />
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Mapir from 'mapir-react-component';
import 'mapir-react-component/dist/index.css';
import { MapPin } from 'lucide-react';
import { mapirReverse, API_BASE, getMapirProxyBase } from '../utils/mapir';

const API_KEY = import.meta.env.VITE_MAPIR_API_KEY ?? '';
const isConfigured = !!API_KEY && API_KEY !== 'your-mapir-api-key';

if (typeof window !== 'undefined') {
  (window as unknown as { __MAPIR_PROXY_BASE__?: string }).__MAPIR_PROXY_BASE__ = getMapirProxyBase();
}

/** Rewrite map.ir URLs to backend proxy (absolute URL required by Request in mapbox-gl). */
function mapirUrlToProxy(url: string): string {
  if (url.startsWith('https://map.ir/') || url.startsWith('https://api.map.ir/')) {
    const base = typeof window !== 'undefined' ? getMapirProxyBase() : API_BASE.replace(/\/$/, '');
    return `${base}/mapir/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const Map = isConfigured
  ? Mapir.setToken({
      transformRequest: (url: string) => ({
        url: mapirUrlToProxy(url),
        headers: {
          'x-api-key': API_KEY,
          'Mapir-SDK': 'reactjs',
        },
      }),
    })
  : null;

const DEFAULT_CENTER: [number, number] = [51.42047, 35.729054];
const DEFAULT_ZOOM: [number] = [12];
/** Wait this long after last map move before calling reverse API (one call per drag) */
const REVERSE_DEBOUNCE_MS = 450;

export interface MapSelectorResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapirMapSelectorProps {
  selectedLat?: number;
  selectedLon?: number;
  /** When this changes, map remounts to recenter (address search selection → map updates). */
  centerKey?: number;
  onSelect: (result: MapSelectorResult) => void;
  /** When provided, map pan only reports coordinates (no address). Omit so pan → address is refreshed. */
  onMapMove?: (lat: number, lon: number) => void;
  height?: number;
}

export function MapirMapSelector({
  selectedLat,
  selectedLon,
  centerKey,
  onSelect,
  onMapMove,
  height = 380,
}: MapirMapSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const moveEndDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipReverseAfterRecenterRef = useRef(false);

  useEffect(() => {
    if (centerKey != null) skipReverseAfterRecenterRef.current = true;
  }, [centerKey]);

  useEffect(() => {
    return () => {
      const el = containerRef.current;
      if (el) el.querySelectorAll('.mapboxgl-map').forEach((node) => node.remove());
      if (moveEndDebounceRef.current != null) {
        clearTimeout(moveEndDebounceRef.current);
        moveEndDebounceRef.current = null;
      }
      reverseAbortRef.current?.abort();
    };
  }, []);

  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  const lastReportedRef = useRef<{ lat: number; lng: number } | null>(
    selectedLat != null && selectedLon != null ? { lat: round(selectedLat), lng: round(selectedLon) } : null
  );

  const fetchAddressForCenter = useCallback(
    (map: { getCenter?: () => { lat: number; lng: number } } | null | undefined) => {
      if (!map?.getCenter) return;
      if (skipReverseAfterRecenterRef.current) {
        skipReverseAfterRecenterRef.current = false;
        return;
      }
      const c = map.getCenter();
      const lat = c.lat;
      const lng = c.lng;
      const rlat = round(lat);
      const rlng = round(lng);
      const last = lastReportedRef.current;
      if (last && last.lat === rlat && last.lng === rlng) return;
      lastReportedRef.current = { lat: rlat, lng: rlng };

      reverseAbortRef.current?.abort();
      const controller = new AbortController();
      reverseAbortRef.current = controller;

      setLoading(true);
      setError(null);
      if (onMapMove) {
        onMapMove(lat, lng);
      } else {
        onSelect({ latitude: lat, longitude: lng, address: '' });
      }
      mapirReverse(lat, lng, controller.signal)
        .then((rev) => {
          if (controller.signal.aborted) return;
          reverseAbortRef.current = null;
          if (onMapMove) {
            onMapMove(lat, lng);
          } else {
            onSelect({
              latitude: lat,
              longitude: lng,
              address: rev?.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
          }
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          reverseAbortRef.current = null;
          setError('دریافت آدرس ناموفق بود.');
          if (onMapMove) {
            onMapMove(lat, lng);
          } else {
            onSelect({
              latitude: lat,
              longitude: lng,
              address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    },
    [onSelect, onMapMove]
  );

  const onMoveEndHandler = useCallback(
    (a: unknown, b?: unknown) => {
      const map = (typeof (a as { getCenter?: () => unknown })?.getCenter === 'function' ? a : b) as { getCenter: () => { lat: number; lng: number } } | undefined;
      if (!map?.getCenter) return;
      if (moveEndDebounceRef.current) clearTimeout(moveEndDebounceRef.current);
      moveEndDebounceRef.current = setTimeout(() => {
        moveEndDebounceRef.current = null;
        fetchAddressForCenter(map);
      }, REVERSE_DEBOUNCE_MS);
    },
    [fetchAddressForCenter]
  );

  const onStyleLoadHandler = useCallback(
    (a: unknown, b?: unknown) => {
      const map = (typeof (a as { getCenter?: () => unknown })?.getCenter === 'function' ? a : b) as { getCenter: () => { lat: number; lng: number } } | undefined;
      fetchAddressForCenter(map);
    },
    [fetchAddressForCenter]
  );

  const center: [number, number] =
    selectedLon != null && selectedLat != null ? [selectedLon, selectedLat] : DEFAULT_CENTER;
  const zoom: [number] =
    selectedLat != null && selectedLon != null ? [16] : DEFAULT_ZOOM;

  if (!isConfigured) {
    return (
      <div
        className="w-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-600"
        style={{ height }}
      >
        <span className="text-sm">کلید API نقشه تنظیم نشده است.</span>
      </div>
    );
  }

  if (!Map) {
    return (
      <div
        className="w-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-600"
        style={{ height }}
      >
        <span className="text-sm">بارگذاری نقشه ناموفق بود.</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative h-[calc(100vh-450px)]">
      <Mapir
        key={centerKey != null ? `map-${centerKey}` : undefined}
        Map={Map}
        apiKey={API_KEY}
        center={center}
        zoom={zoom}
        onMoveEnd={onMoveEndHandler}
        onStyleLoad={onStyleLoadHandler}
        containerStyle={{ width: '100%', height: '100%', minHeight: height }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <MapPin className="w-12 h-12 text-primary-600 drop-shadow-lg -translate-y-1/2" style={{ marginBottom: 0 }} />
      </div>
      {loading && (
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-white/95 px-3 py-1 rounded text-sm shadow">در حال دریافت آدرس...</span>
        </div>
      )}
      {error && (
        <p className="absolute top-2 left-2 right-2 text-sm text-red-600 bg-white/90 px-2 py-1 rounded text-center">{error}</p>
      )}
      <p className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded text-center pointer-events-none">
        نقشه را جابجا کنید تا پین روی موقعیت مورد نظر قرار گیرد؛ آدرس خودکار پر می‌شود.
      </p>
    </div>
  );
}
