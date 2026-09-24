// Typed API client for the admin SPA
import { ofetch, type FetchOptions } from 'ofetch';

const BASE = import.meta.env['VITE_API_BASE'] ?? 'http://localhost:3000/api/v1';

const STORAGE_KEY = 'admin_access_token';

// Token store (in-memory + localStorage fallback)
let _accessToken: string | null = null;
try {
  _accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
} catch {
  // fallback
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // fallback
  }
}

export function getAccessToken() {
  if (!_accessToken && typeof localStorage !== 'undefined') {
    try {
      _accessToken = localStorage.getItem(STORAGE_KEY);
    } catch {
      // fallback
    }
  }
  return _accessToken;
}

export async function apiGet<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  const token = getAccessToken();
  const options: FetchOptions<'json'> = {
    method: 'GET',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  if (query) {
    options.query = query;
  }
  return ofetch<T>(`${BASE}${path}`, options);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = getAccessToken();
  return ofetch<T>(`${BASE}${path}`, {
    method: 'POST',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const token = getAccessToken();
  return ofetch<T>(`${BASE}${path}`, {
    method: 'PATCH',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const token = getAccessToken();
  return ofetch<T>(`${BASE}${path}`, {
    method: 'PUT',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = getAccessToken();
  return ofetch<T>(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getAccessToken();
  return ofetch<T>(`${BASE}${path}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Auto-refresh: if a 401 is received, try to refresh token once
export async function apiWithRefresh<T>(fn: () => Promise<T>, refreshFn: () => Promise<string | null>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // Check for 401
    if ((err as { status?: number })?.status === 401) {
      const newToken = await refreshFn();
      if (newToken) {
        setAccessToken(newToken);
        return fn();
      }
    }
    throw err;
  }
}
