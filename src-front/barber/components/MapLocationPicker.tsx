import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { mapirSearch, mapirStaticMapUrl, isMapirConfigured, type MapirSearchItem } from '../utils/mapir';
import { MapirMapSelector } from './MapirMapSelector';

export interface MapLocationResult {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface MapLocationPickerProps {
  /** Current address text */
  value: string;
  onChange: (address: string, latitude?: number, longitude?: number) => void;
  /** Called when location is set from search (autocomplete or first result); use to recenter map */
  onMoveMapTo?: (latitude: number, longitude: number) => void;
  placeholder?: string;
  label?: string;
  /** When true, show "Select on map" button that opens a bottom sheet with search + map preview */
  showMapSheet?: boolean;
  onOpenMapSheet?: () => void;
  /** For use inside a bottom sheet: show search + static map and confirm */
  mode?: 'inline' | 'sheet';
  onConfirm?: (result: MapLocationResult) => void;
  onCancel?: () => void;
}

/** Debounce: run search only after user has paused this long (avoids fetch-while-typing) */
const SEARCH_DEBOUNCE_MS = 1800;
/** Don’t call API until at least this many characters */
const MIN_SEARCH_LENGTH = 3;
/** Show loading spinner only after request has been in flight this long (avoids flash while typing) */
const LOADING_INDICATOR_DELAY_MS = 400;

export function MapLocationPicker({
  value,
  onChange,
  onMoveMapTo,
  placeholder = 'آدرس (خیابان، شهر)',
  label = 'آدرس',
  showMapSheet = true,
  onOpenMapSheet,
  mode = 'inline',
  onConfirm,
  onCancel,
}: MapLocationPickerProps) {
  const [suggestions, setSuggestions] = useState<MapirSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const isConfigured = isMapirConfigured();

  const runSearch = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || q.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setShowLoadingSpinner(false);
      return;
    }
    abortRef.current?.abort();
    if (loadingDelayRef.current) {
      clearTimeout(loadingDelayRef.current);
      loadingDelayRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setShowLoadingSpinner(false);
    loadingDelayRef.current = setTimeout(() => {
      loadingDelayRef.current = null;
      if (!controller.signal.aborted) setShowLoadingSpinner(true);
    }, LOADING_INDICATOR_DELAY_MS);
    try {
      const items = await mapirSearch(q, controller.signal);
      if (controller.signal.aborted) return;
      abortRef.current = null;
      setSuggestions(items);
      setOpen(true);
    } catch {
      if (!controller.signal.aborted) abortRef.current = null;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setShowLoadingSpinner(false);
      }
      if (loadingDelayRef.current) {
        clearTimeout(loadingDelayRef.current);
        loadingDelayRef.current = null;
      }
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      onChange(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!v.trim() || v.trim().length < MIN_SEARCH_LENGTH) {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
        setShowLoadingSpinner(false);
        if (loadingDelayRef.current) {
          clearTimeout(loadingDelayRef.current);
          loadingDelayRef.current = null;
        }
        abortRef.current?.abort();
        return;
      }
      debounceRef.current = setTimeout(() => runSearch(v), SEARCH_DEBOUNCE_MS);
    },
    [onChange, runSearch]
  );

  const handleSelect = useCallback(
    (item: MapirSearchItem) => {
      onChange(item.address, item.latitude, item.longitude);
      onMoveMapTo?.(item.latitude, item.longitude);
      setSuggestions([]);
      setOpen(false);
      if (mode === 'sheet' && onConfirm) {
        onConfirm({
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
        });
      }
    },
    [onChange, onMoveMapTo, mode, onConfirm]
  );

  useEffect(() => {
    const t = debounceRef.current;
    const ld = loadingDelayRef.current;
    const ac = abortRef.current;
    return () => {
      if (t) clearTimeout(t);
      if (ld) clearTimeout(ld);
      ac?.abort();
    };
  }, []);

  useEffect(() => {
    if (!open || suggestions.length === 0) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, suggestions.length]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value ?? ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {showLoadingSpinner && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            ...
          </div>
        )}
        {open && suggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {suggestions.map((item, i) => {
              const isPlace = item.type === 'POI' || (item.type && !/Roads|Cities|Neighborhoods|Counties|Provinces|Region/i.test(item.type));
              const typeLabel = item.type ? (isPlace ? 'مکان' : 'آدرس') : null;
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full text-right px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => handleSelect(item)}
                  >
                    <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 flex-1">{item.address}</span>
                    {typeLabel && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {typeLabel}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {showMapSheet && onOpenMapSheet && (
        <button
          type="button"
          onClick={onOpenMapSheet}
          className="w-full h-12 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition"
        >
          <MapPin size={18} />
          انتخاب از روی نقشه
        </button>
      )}
      {!isConfigured && (
        <p className="text-xs text-gray-500">
          برای جستجوی آدرس، کلید API نقشه (Map.ir) را در تنظیمات پروژه تنظیم کنید.
        </p>
      )}
    </div>
  );
}

/** Bottom sheet content: search + optional static map preview + confirm. */
export function MapLocationSheetContent({
  initialAddress,
  initialLat,
  initialLon,
  onConfirm,
  onCancel,
}: {
  initialAddress: string;
  initialLat?: number;
  initialLon?: number;
  onConfirm: (result: MapLocationResult) => void;
  onCancel: () => void;
}) {
  const [address, setAddress] = useState(initialAddress ?? '');
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lon, setLon] = useState<number | undefined>(initialLon);
  const configured = isMapirConfigured();
  const staticUrl = lat != null && lon != null ? mapirStaticMapUrl(lat, lon) : '';

  const handleConfirm = () => {
    onConfirm({ address: address ?? '', latitude: lat, longitude: lon });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <MapLocationPicker
        value={address ?? ''}
        onChange={(a, la, lo) => {
          setAddress(a);
          setLat(la);
          setLon(lo);
        }}
        placeholder="جستجوی آدرس (مثال: تهران، میدان آزادی)"
        showMapSheet={false}
        mode="inline"
      />
      {configured && staticUrl && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-200">
          <img
            src={staticUrl}
            alt="موقعیت روی نقشه"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <MapPin className="w-10 h-10 text-primary-600 drop-shadow-lg" />
          </div>
        </div>
      )}
      {configured && !staticUrl && address && (
        <p className="text-sm text-gray-600">یک آدرس از لیست پیشنهادها انتخاب کنید تا موقعیت روی نقشه نمایش داده شود.</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 rounded-md border border-gray-300 text-gray-700 font-semibold"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 h-12 bg-primary-600 text-white font-bold rounded-md"
        >
          تایید موقعیت مکانی
        </button>
      </div>
    </div>
  );
}
