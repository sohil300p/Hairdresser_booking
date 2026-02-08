/**
 * Map.ir API proxy. Calls Map.ir from server with MAPIR_API_KEY to avoid CORS and hide key.
 * Base URL from Map.ir Web SDK (mapp.env.js): https://map.ir for search/reverse.
 * GET /mapir/proxy?url=ENCODED – proxies tile/vector requests to avoid CORS from localhost.
 * Docs: https://help.map.ir/reverse_api/ , https://help.map.ir/documentation/searchv2-docs/
 */

import { Request, Response } from 'express';

const MAPIR_BASE = process.env.MAPIR_BASE_URL || 'https://map.ir';
const ALLOWED_MAPIR_ORIGINS = ['https://map.ir', 'https://api.map.ir'];
const API_KEY = process.env.MAPIR_API_KEY || process.env.VITE_MAPIR_API_KEY || '';
/** Timeout for Map.ir upstream requests (ms). Avoids hanging on slow/failed API. */
const MAPIR_FETCH_TIMEOUT_MS = Number(process.env.MAPIR_FETCH_TIMEOUT_MS) || 12_000;

function getApiKey(): string {
  const key = API_KEY;
  if (!key || key === 'your-mapir-api-key') return '';
  return key;
}

function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = MAPIR_FETCH_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

/**
 * GET /mapir/reverse?lat=&lon=
 * Proxies to Map.ir Reverse Geocoding (address from coordinates).
 */
export async function mapirReverseController(req: Request, res: Response): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(503).json({ error: 'Map.ir API key not configured' });
    return;
  }

  const lat = req.query.lat;
  const lon = req.query.lon;
  if (lat == null || lon == null || String(lat).trim() === '' || String(lon).trim() === '') {
    res.status(400).json({ error: 'lat and lon query parameters required' });
    return;
  }

  try {
    const url = `${MAPIR_BASE}/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;
    const proxyRes = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    const data = await proxyRes.json().catch(() => ({}));

    if (!proxyRes.ok) {
      res.status(proxyRes.status).json(data || { error: 'Map.ir reverse request failed' });
      return;
    }

    res.json(data);
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error('Map.ir reverse proxy error:', isAbort ? 'timeout' : err);
    res.status(502).json({ error: 'Map.ir reverse service unavailable' });
  }
}

/** Map.ir search base; Laravel package uses https://map.ir (see map-ir/laravel-package). */
const MAPIR_SEARCH_BASE = process.env.MAPIR_SEARCH_BASE_URL || process.env.MAPIR_BASE_URL || 'https://map.ir';
/** Optional: separate Places/POI API base (e.g. https://api.map.ir/places). When set, we call it for place search. */
const MAPIR_PLACES_BASE = process.env.MAPIR_PLACES_BASE_URL || '';

/**
 * Normalize Map.ir search response to { value: [{ address, geom, type? }, ...] }.
 * Handles address + POI/place results (address, formattedAddress, title, name).
 */
function normalizeSearchResponse(data: unknown): {
  value: Array<{ address: string; geom: { coordinates: [number, number] }; type?: string }>;
} {
  const raw = data as { value?: unknown[]; items?: unknown[]; results?: unknown[] };
  const list = raw?.value ?? raw?.items ?? raw?.results ?? (Array.isArray(data) ? data : []);
  const seen = new Set<string>();
  const value = (list as unknown[]).map((x: Record<string, unknown>) => {
    const geom = x?.geom as { coordinates?: number[] } | undefined;
    const coords = Array.isArray(geom?.coordinates) ? geom.coordinates : [];
    const lat = typeof x?.latitude === 'number' ? x.latitude : coords[1];
    const lon = typeof x?.longitude === 'number' ? x.longitude : coords[0];
    const address =
      (typeof x?.address === 'string' ? x.address : null) ??
      (typeof x?.formattedAddress === 'string' ? x.formattedAddress : null) ??
      (typeof x?.title === 'string' ? x.title : null) ??
      (typeof x?.name === 'string' ? x.name : null) ??
      '';
    if (address === '' || (lat == null && lon == null) || (Number.isNaN(Number(lat)) && Number.isNaN(Number(lon))))
      return null;
    const latN = Number(lat);
    const lonN = Number(lon);
    if (Number.isNaN(latN) || Number.isNaN(lonN)) return null;
    const type = (x?.type ?? x?.category ?? x?.kind) as string | undefined;
    const key = `${latN.toFixed(5)}_${lonN.toFixed(5)}_${address}`;
    if (seen.has(key)) return null;
    seen.add(key);
    return { address, geom: { coordinates: [lonN, latN] as [number, number] }, type };
  }).filter(
    (item): item is { address: string; geom: { coordinates: [number, number] }; type?: string } => item != null
  );
  return { value };
}

/**
 * GET /mapir/search?text=  or  POST /mapir/search  with body { text } or query ?text=
 * Forward geocoding: address text → lat/lon. Proxies to Map.ir using Laravel package pattern:
 * POST https://map.ir/search/v2 with JSON body { text } (optional lat, lon for bias).
 * See https://github.com/map-ir/laravel-package (MapirLaravel::search_v2, searchAutocomplete_v2).
 */
export async function mapirSearchController(req: Request, res: Response): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(503).json({ value: [], error: 'Map.ir API key not configured' });
    return;
  }

  const text = (req.query.text ?? (req.body && typeof req.body === 'object' ? req.body.text : null)) as string | undefined;
  if (text == null || String(text).trim() === '') {
    res.status(200).json({ value: [] });
    return;
  }

  const query = String(text).trim();
  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

  try {
    const placesRequest = MAPIR_PLACES_BASE
      ? fetchWithTimeout(`${MAPIR_PLACES_BASE.replace(/\/$/, '')}/search`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: query }),
        })
      : fetchWithTimeout(`${MAPIR_SEARCH_BASE}/search/v2?$select=POI`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: query }),
        });

    const [placesRes, addressRes] = await Promise.all([
      placesRequest,
      fetchWithTimeout(`${MAPIR_SEARCH_BASE}/search/v2`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: query,
          $select: 'Roads,Cities,Neighborhoods,Counties,Provinces,Region',
        }),
      }),
    ]);

    const [placesData, addressData] = await Promise.all([
      placesRes.json().catch(() => ({})),
      addressRes.json().catch(() => ({})),
    ]);

    const placesOk = placesRes.ok;
    const addressOk = addressRes.ok;
    const placesList = placesOk ? normalizeSearchResponse(placesData).value : [];
    const addressList = addressOk ? normalizeSearchResponse(addressData).value : [];

    if (!addressOk) {
      const fallbackRes = await fetchWithTimeout(`${MAPIR_SEARCH_BASE}/search/v2`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: query }),
      });
      const fallbackData = await fallbackRes.json().catch(() => ({}));
      if (fallbackRes.ok) {
        res.json(normalizeSearchResponse(fallbackData));
        return;
      }
      if (fallbackRes.status >= 500) {
        console.error('Map.ir search upstream error:', fallbackRes.status, fallbackData);
      }
      res.status(fallbackRes.status).json(normalizeSearchResponse(fallbackData));
      return;
    }

    const seen = new Set<string>();
    const value: Array<{ address: string; geom: { coordinates: [number, number] }; type?: string }> = [];
    for (const item of placesList) {
      const key = `${item.geom.coordinates[1].toFixed(5)}_${item.geom.coordinates[0].toFixed(5)}_${item.address}`;
      if (seen.has(key)) continue;
      seen.add(key);
      value.push({ ...item, type: item.type || 'POI' });
    }
    for (const item of addressList) {
      const key = `${item.geom.coordinates[1].toFixed(5)}_${item.geom.coordinates[0].toFixed(5)}_${item.address}`;
      if (seen.has(key)) continue;
      seen.add(key);
      value.push(item);
    }

    res.json({ value });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error('Map.ir search proxy error:', isAbort ? 'timeout' : err);
    res.status(200).json({ value: [] });
  }
}

/**
 * GET /mapir/proxy?url=ENCODED
 * Proxies Map.ir tile/vector requests server-side to avoid CORS from localhost.
 * Only allows URLs from map.ir and api.map.ir.
 */
export async function mapirProxyController(req: Request, res: Response): Promise<void> {
  const raw = req.query.url;
  if (typeof raw !== 'string' || !raw.trim()) {
    res.status(400).json({ error: 'url query parameter required' });
    return;
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw.trim());
  } catch {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  const allowed = ALLOWED_MAPIR_ORIGINS.some((o) => targetUrl.startsWith(o + '/') || targetUrl === o);
  if (!allowed) {
    res.status(403).json({ error: 'URL must be from map.ir' });
    return;
  }

  try {
    const fetchOpts: RequestInit & { timeoutMs?: number } = {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: { 'x-api-key': getApiKey(), 'Mapir-SDK': 'reactjs' },
    };
    if (req.method === 'POST' && req.body instanceof Buffer && req.body.length > 0) {
      fetchOpts.body = req.body;
    }

    const proxyRes = await fetchWithTimeout(targetUrl, fetchOpts);

    const contentType = proxyRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const buffer = await proxyRes.arrayBuffer();
    res.status(proxyRes.status).send(Buffer.from(buffer));
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error('Map.ir proxy error:', isAbort ? 'timeout' : err);
    res.status(502).json({ error: 'Map.ir proxy unavailable' });
  }
}
