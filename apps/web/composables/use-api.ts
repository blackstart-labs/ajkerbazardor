// Composable: typed wrapper around the public API
export function useApi() {
  const isLocal =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  let base = isLocal ? 'http://localhost:3000/api/v1' : 'https://api-tawny-pi-32.vercel.app/api/v1';
  try {
    const config = useRuntimeConfig();
    if (config.public?.apiBase) {
      base = config.public.apiBase as string;
    }
  } catch {
    // Fallback if called outside Nuxt active instance
  }

  function get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return $fetch<T>(`${base}${path}`, query ? { query } : {});
  }

  return { get };
}
