// Composable: typed wrapper around the public API
import { DEFAULT_PUBLIC_API_BASE } from '@ajkerbazardor/shared';

export function useApi() {
  const isLocal =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  let base = isLocal ? 'http://localhost:3000/api/v1' : DEFAULT_PUBLIC_API_BASE;
  try {
    const config = useRuntimeConfig();
    if (config.public?.apiBase) {
      base = config.public.apiBase as string;
    }
  } catch {
    // Fallback if called outside Nuxt active instance
  }

  async function get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    try {
      return await $fetch<T>(`${base}${path}`, query ? { query } : {});
    } catch (err) {
      const failedWithoutResponse = !(err as { response?: unknown })?.response;
      const localApiUnavailable = /^https?:\/\/localhost:3000\/api\/v1\/?$/.test(base);

      if (localApiUnavailable && failedWithoutResponse) {
        return $fetch<T>(`${DEFAULT_PUBLIC_API_BASE}${path}`, query ? { query } : {});
      }

      throw err;
    }
  }

  return { get };
}
