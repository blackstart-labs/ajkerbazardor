// Typed API client for the admin SPA
import { ofetch, type FetchOptions } from 'ofetch';

export type ApiTargetMode = 'local' | 'live';

const TARGET_STORAGE_KEY = 'admin_api_target_mode';
export const LOCAL_API_BASE = 'http://localhost:3000/api/v1';
export const LIVE_API_BASE = 'https://api-tawny-pi-32.vercel.app/api/v1';

export function getApiTargetMode(): ApiTargetMode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(TARGET_STORAGE_KEY);
    if (saved === 'local' || saved === 'live') return saved;
    return window.location.hostname === 'localhost' ? 'local' : 'live';
  }
  return 'local';
}

export function setApiTargetMode(mode: ApiTargetMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TARGET_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('admin_api_target_changed', { detail: mode }));
  }
}

export function getApiBase(): string {
  const mode = getApiTargetMode();
  if (mode === 'live') {
    return LIVE_API_BASE;
  }
  return import.meta.env['VITE_API_BASE'] || LOCAL_API_BASE;
}

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

async function request<T>(path: string, options: FetchOptions<'json'>): Promise<T> {
  const base = getApiBase();
  try {
    return await ofetch<T>(`${base}${path}`, options);
  } catch (err) {
    const mode = getApiTargetMode();
    const failedWithoutResponse = !(err as { response?: unknown })?.response;

    if (failedWithoutResponse) {
      if (mode === 'local') {
        throw new Error(
          'লোকাল API সার্ভার (http://localhost:3000) সচল নেই। টার্মিনালে API চালু করুন অথবা "লাইভ সার্ভার" মোডে স্যুইচ করুন।',
        );
      } else {
        throw new Error(
          'লাইভ সার্ভার রেসপন্স করছে না। ইন্টারনেট কানেকশন বা সার্ভার স্ট্যাটাস যাচাই করুন অথবা লোকাল মোডে স্যুইচ করুন।',
        );
      }
    }

    throw err;
  }
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
  return request<T>(path, options);
}

export async function apiPost<T>(path: string, body?: FetchOptions<'json'>['body']): Promise<T> {
  const token = getAccessToken();
  return request<T>(path, {
    method: 'POST',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPatch<T>(path: string, body?: FetchOptions<'json'>['body']): Promise<T> {
  const token = getAccessToken();
  return request<T>(path, {
    method: 'PATCH',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPut<T>(path: string, body?: FetchOptions<'json'>['body']): Promise<T> {
  const token = getAccessToken();
  return request<T>(path, {
    method: 'PUT',
    body,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = getAccessToken();
  return request<T>(path, {
    method: 'DELETE',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getAccessToken();
  return request<T>(path, {
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
