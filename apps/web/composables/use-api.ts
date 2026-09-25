// Composable: typed wrapper around the public API
export function useApi() {
  let base = 'https://api-tawny-pi-32.vercel.app/api/v1';
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
