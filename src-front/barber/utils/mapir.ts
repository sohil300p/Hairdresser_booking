/**
 * Map.ir (نقشه ایران): search and reverse geocode via backend proxy.
 * Backend uses MAPIR_API_KEY. Map component still uses VITE_MAPIR_API_KEY for tiles.
 * Docs: https://help.map.ir/reverse_api/ , https://help.map.ir/documentation/searchv2-docs/
 */

export const API_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== ''
      ? import.meta.env.VITE_API_BASE_URL
      : 'http://localhost:3000/api');

/** Absolute URL for Map.ir proxy (required by Request constructor in mapbox-gl). */
export function getMapirProxyBase(): string {
  const base = API_BASE.replace(/\/$/, '');
  if (typeof window === 'undefined') return base;
  return base.startsWith('http') ? base : `${window.location.origin}${base.startsWith('/') ? base : `/${base}`}`;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_MAPIR_API_KEY;
  if (!key || key === 'your-mapir-api-key') return '';
  return key;
}

export interface MapirSearchItem {
  address: string;
  latitude: number;
  longitude: number;
  title?: string;
  /** e.g. POI, Roads, Cities – from Map.ir when both place and address search are used */
  type?: string;
}

const SEARCH_TIMEOUT_MS = 10_000;

/**
 * Search/autocomplete addresses via backend proxy → Map.ir Search v2.
 * Optional signal aborts the request when user keeps typing (avoids wrong/outdated results).
 */
export async function mapirSearch(text: string, signal?: AbortSignal | null): Promise<MapirSearchItem[]> {
  const q = String(text).trim();
  if (!q) return [];
  if (signal?.aborted) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(`${API_BASE}/mapir/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: q }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    const items = data?.value ?? data?.items ?? data?.results ?? (Array.isArray(data) ? data : []);
    return items
      .map((x: Record<string, unknown>) => {
        const lat = typeof x?.latitude === 'number' ? x.latitude : Array.isArray((x?.geom as { coordinates?: number[] })?.coordinates) ? (x.geom as { coordinates: number[] }).coordinates[1] : NaN;
        const lon = typeof x?.longitude === 'number' ? x.longitude : Array.isArray((x?.geom as { coordinates?: number[] })?.coordinates) ? (x.geom as { coordinates: number[] }).coordinates[0] : NaN;
        const address = (typeof x?.address === 'string' ? x.address : null) ?? (typeof x?.formattedAddress === 'string' ? x.formattedAddress : null) ?? (typeof x?.title === 'string' ? x.title : null) ?? (typeof x?.name === 'string' ? x.name : null) ?? '';
        const type = (x?.type ?? x?.category ?? x?.kind) as string | undefined;
        return {
          address: String(address || ''),
          latitude: Number(lat),
          longitude: Number(lon),
          title: (x?.title ?? x?.address ?? x?.formattedAddress ?? address) as string,
          type,
        };
      })
      .filter((x: MapirSearchItem) => x.address !== '' && !Number.isNaN(x.latitude) && !Number.isNaN(x.longitude));
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

export interface MapirReverseResult {
  address: string;
  latitude: number;
  longitude: number;
}

const REVERSE_TIMEOUT_MS = 8_000;

/** Remove duplicate segments (e.g. "تهران" repeated) from Map.ir reverse address. */
function normalizeReverseAddress(addr: string): string {
  const parts = addr.split(/[،,]+/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const kept = parts.filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
  return kept.join('، ');
}

/**
 * Reverse geocode: get address from lat/lon via backend proxy → Map.ir Reverse.
 * Prefers compact address and deduplicates repeated parts (e.g. تهران).
 */
export async function mapirReverse(lat: number, lon: number, signal?: AbortSignal | null): Promise<MapirReverseResult | null> {
  if (signal?.aborted) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REVERSE_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort());
  try {
    const res = await fetch(
      `${API_BASE}/mapir/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const raw =
      data?.address_compact ?? data?.addressCompact ?? data?.address ?? null;
    if (!raw) return null;
    const address = normalizeReverseAddress(String(raw));
    return {
      address,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Static map image URL (Map.ir raster). Requires VITE_MAPIR_API_KEY for direct URL.
 */
export function mapirStaticMapUrl(lat: number, lon: number, width = 400, height = 280, zoom = 16): string {
  const apiKey = getApiKey();
  if (!apiKey) return '';
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    lat: String(lat),
    lon: String(lon),
    zoom: String(zoom),
    markers: `color:red|${lat},${lon}`,
  });
  return `https://api.map.ir/raster/static?${params.toString()}`;
}

export function isMapirConfigured(): boolean {
  return !!getApiKey();
}
