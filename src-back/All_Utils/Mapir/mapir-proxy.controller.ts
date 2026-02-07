/**
 * Map.ir API proxy. Calls Map.ir from server with MAPIR_API_KEY to avoid CORS and hide key.
 * Base URL from Map.ir Web SDK (mapp.env.js): https://map.ir for search/reverse.
 * Docs: https://help.map.ir/reverse_api/ , https://help.map.ir/documentation/searchv2-docs/
 */

import { Request, Response } from 'express';

const MAPIR_BASE = process.env.MAPIR_BASE_URL || 'https://map.ir';
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

/**
 * GET /mapir/search?text=  or  POST /mapir/search  with body { text } or query ?text=
 * Proxies to Map.ir Search (geocode/autocomplete). Uses /search per Web SDK (map.ir).
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

  try {
    const url = `${MAPIR_BASE}/search?text=${encodeURIComponent(String(text).trim())}`;
    const proxyRes = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    const data = await proxyRes.json().catch(() => ({}));

    if (proxyRes.ok) {
      res.json(data);
      return;
    }

    if (proxyRes.status >= 500) {
      console.error('Map.ir search upstream error:', proxyRes.status, data);
      res.status(200).json({ value: [] });
      return;
    }

    res.status(proxyRes.status).json(data?.value != null ? data : { value: [], ...data });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error('Map.ir search proxy error:', isAbort ? 'timeout' : err);
    res.status(200).json({ value: [] });
  }
}
