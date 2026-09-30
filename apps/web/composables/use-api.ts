// Composable: typed wrapper around the public API
const DEFAULT_PUBLIC_API_BASE = 'https://api-tawny-pi-32.vercel.app/api/v1';

export function useApi() {
  const isLocal =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  let base = isLocal ? '/api/v1' : DEFAULT_PUBLIC_API_BASE;
  try {
    const config = useRuntimeConfig();
    if (!isLocal && config.public?.apiBase) {
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
      const localProxyUnavailable = base === '/api/v1';

      if (localProxyUnavailable && failedWithoutResponse) {
        throw new Error(
          'Local API proxy is unreachable. Start the API or configure NUXT_API_PROXY_TARGET in apps/web/.env.',
        );
      }

      throw err;
    }
  }

  return { get };
}
