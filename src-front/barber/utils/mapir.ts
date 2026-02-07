/**
 * Map.ir (نقشه ایران): search and reverse geocode via backend proxy.
 * Backend uses MAPIR_API_KEY. Map component still uses VITE_MAPIR_API_KEY for tiles.
 * Docs: https://help.map.ir/reverse_api/ , https://help.map.ir/documentation/searchv2-docs/
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    const items = data?.value ?? data?.items ?? Array.isArray(data) ? data : [];
    return items
      .filter((x: { address?: unknown; geom?: { coordinates?: unknown[] } }) => x?.address != null && x?.geom?.coordinates != null)
      .map((x: { address: string; geom: { coordinates: number[] }; title?: string }) => {
        const [lon, lat] = Array.isArray(x.geom?.coordinates) ? x.geom.coordinates : [NaN, NaN];
        return {
          address: String(x.address),
          latitude: Number(lat),
          longitude: Number(lon),
          title: x.title ?? x.address,
        };
      })
      .filter((x: MapirSearchItem) => !Number.isNaN(x.latitude) && !Number.isNaN(x.longitude));
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

/**
 * Reverse geocode: get address from lat/lon via backend proxy → Map.ir Reverse.
 * Optional signal allows cancelling when map is moved again before response.
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
    const address =
      data?.address ?? data?.addressCompact ?? data?.address_compact ?? null;
    if (!address) return null;
    return {
      address: String(address),
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
