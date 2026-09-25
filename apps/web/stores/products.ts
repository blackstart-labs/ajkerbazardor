// Pinia store for products listing, filtering, and single product PDP
import { defineStore } from 'pinia';

export interface ProductCard {
  id: number;
  slug: string;
  nameBn: string;
  categoryNameBn?: string;
  categorySlug?: string;
  unitLabel: string;
  minPrice: number | null;
  maxPrice: number | null;
  delta?: number | null;
  changePct?: number | null;
  direction?: 'up' | 'down' | 'same' | 'no_data';
  sparkline?: (number | null)[];
  imageUrl?: string | null;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Category {
  id: number;
  slug: string;
  nameBn: string;
}

export interface ProductDetail extends ProductCard {
  today: PriceContext | null;
  week: PriceContext | null;
  month: PriceContext | null;
  year: PriceContext | null;
}

export interface PriceContext {
  date: string;
  minPrice: number | null;
  maxPrice: number | null;
  changePct: number | null;
  direction: 'up' | 'down' | 'same' | 'no_data';
}

export interface HistoryPoint {
  date: string;
  min: number | null;
  max: number | null;
  mid: number | null;
}

export type SortKey = 'price_asc' | 'price_desc' | 'change_asc' | 'change_desc' | 'name' | 'sort_order';

export function resolveProductImage(nameBn?: string | null, existingImage?: string | null): string | null {
  if (existingImage && existingImage.trim().length > 0) {
    return existingImage;
  }
  if (!nameBn) return null;
  if (nameBn.includes('চাল') && nameBn.includes('সুগন্ধী'))
    return encodeURI('/images/products/চাল সুগন্ধী (পোলাও).webp');
  if (nameBn.includes('আটা') && nameBn.includes('খোলা')) return encodeURI('/images/products/আটা সাদা (খোলা).webp');
  if (nameBn.includes('আটা') && nameBn.includes('প্যাকেট')) return encodeURI('/images/products/আটা (প্যাকেট).jpeg');
  if (nameBn.includes('ময়দা') && nameBn.includes('খোলা')) return encodeURI('/images/products/ময়দা (খোলা).jpeg');
  if (nameBn.includes('ময়দা') && nameBn.includes('প্যাকেট')) return encodeURI('/images/products/ময়দা (প্যাকেট).jpeg');
  if (nameBn.includes('সয়াবিন')) return encodeURI('/images/products/সয়াবিন তেল.webp');
  if (nameBn.includes('পাম অয়েল')) return encodeURI('/images/products/পাম অয়েল.webp');
  if (nameBn.includes('খেজুর')) return encodeURI('/images/products/খেজুর.jpg');
  if (nameBn.includes('লবণ')) return encodeURI('/images/products/লবণ.jpg');
  if (nameBn.includes('লেবু')) return encodeURI('/images/products/লেবু.jpeg');
  if (nameBn.includes('কাঁচামরিচ')) return encodeURI('/images/products/কাঁচামরিচ.jpg');
  if (nameBn.includes('বেগুন')) return encodeURI('/images/products/বেগুন.jpeg');
  if (nameBn.includes('শসা')) return encodeURI('/images/products/শসা.jpg');
  if (nameBn.includes('ডিম')) return encodeURI('/images/products/ডিম (ফার্ম).jpg');
  if (nameBn.includes('কাগজ')) return encodeURI('/images/products/লেখার কাগজ.jpeg');
  if (nameBn.includes('রড')) return encodeURI('/images/products/এম,এস রড.jpg');
  return null;
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [] as ProductCard[],
    meta: null as ProductListMeta | null,
    categories: [] as Category[],

    // Filters
    activeCategory: null as string | null,
    searchQuery: '',
    sort: 'sort_order' as SortKey,
    directionFilter: null as 'up' | 'down' | 'same' | null,

    // PDP
    currentProduct: null as ProductDetail | null,
    history: [] as HistoryPoint[],
    historyRange: '30d',

    loading: false,
    pdpLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCategories() {
      try {
        const api = useApi();
        const res = await api.get<{ ok: boolean; data: Category[] }>('/categories');
        this.categories = res.data ?? [];
      } catch {
        // non-fatal
      }
    },

    async fetchProducts(opts: { page?: number; resetItems?: boolean } = {}) {
      this.loading = true;
      this.error = null;
      if (opts.resetItems) this.items = [];
      try {
        const api = useApi();
        const query: Record<string, unknown> = {
          page: opts.page ?? 1,
          limit: 24,
          sort: this.sort,
        };
        if (this.activeCategory) query['category'] = this.activeCategory;
        if (this.searchQuery.trim()) query['q'] = this.searchQuery.trim();
        if (this.directionFilter) query['direction'] = this.directionFilter;

        const res = await api.get<{
          ok: boolean;
          data: {
            items?: Record<string, unknown>[];
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
            pages?: number;
          };
        }>('/products', query);
        const data = res?.data;
        const rawItems = data?.items ?? [];
        const items: ProductCard[] = rawItems.map((item) => {
          const cat = item['category'] as Record<string, unknown> | undefined;
          const u = item['unit'] as Record<string, unknown> | undefined;
          const pr = item['price'] as Record<string, unknown> | undefined;
          const spk = Array.isArray(item['sparkline']) ? item['sparkline'] : [];

          return {
            id: item['id'] as number,
            slug: item['slug'] as string,
            nameBn: item['nameBn'] as string,
            categoryNameBn: (cat?.['nameBn'] as string) ?? (item['categoryNameBn'] as string),
            categorySlug: (cat?.['slug'] as string) ?? (item['categorySlug'] as string),
            unitLabel: (u?.['labelBn'] as string) ?? (item['unitLabel'] as string) ?? '',
            minPrice: (pr?.['min'] as number) ?? (item['minPrice'] as number) ?? null,
            maxPrice: (pr?.['max'] as number) ?? (item['maxPrice'] as number) ?? null,
            delta: (pr?.['changeAmount'] as number) ?? (item['delta'] as number) ?? null,
            changePct: (pr?.['changePct'] as number) ?? (item['changePct'] as number) ?? null,
            direction:
              (pr?.['direction'] as 'up' | 'down' | 'same') ?? (item['direction'] as 'up' | 'down' | 'same') ?? 'same',
            sparkline: spk.map((s) =>
              typeof s === 'number' ? s : (((s as Record<string, unknown>)?.['mid'] as number) ?? null),
            ),
            imageUrl: resolveProductImage(
              item['nameBn'] as string,
              (item['image'] as string) ?? (item['imageUrl'] as string),
            ),
          };
        });
        if (opts.resetItems || (opts.page ?? 1) === 1) {
          this.items = items;
        } else {
          this.items = [...this.items, ...items];
        }
        this.meta = {
          total: data?.total ?? 0,
          page: data?.page ?? 1,
          limit: data?.limit ?? 24,
          pages: data?.totalPages ?? data?.pages ?? 0,
        };
      } catch (err) {
        console.error('fetchProducts error:', err);
        this.error = 'পণ্য তালিকা লোড করা যায়নি।';
      } finally {
        this.loading = false;
      }
    },

    async fetchProductBySlug(slug: string) {
      this.pdpLoading = true;
      this.currentProduct = null;
      try {
        const api = useApi();
        const encodedSlug = encodeURIComponent(slug);
        const res = await api.get<{ ok: boolean; data: Record<string, unknown> }>(`/products/${encodedSlug}`);
        const raw = res?.data;
        if (!raw) {
          this.currentProduct = null;
          return;
        }

        const currentPrice = raw['currentPrice'] as Record<string, unknown> | undefined;
        const ctx = (raw['context'] as Record<string, unknown>) ?? {};
        const cat = raw['category'] as Record<string, unknown> | undefined;
        const u = raw['unit'] as Record<string, unknown> | undefined;

        const mapContext = (item: unknown): PriceContext | null => {
          if (!item || typeof item !== 'object') return null;
          const it = item as Record<string, unknown>;
          if (it['min'] === null && it['max'] === null) return null;
          return {
            date: (it['date'] as string) ?? '',
            minPrice: (it['min'] as number) ?? null,
            maxPrice: (it['max'] as number) ?? null,
            changePct: (it['changePct'] as number) ?? null,
            direction: (it['direction'] as 'up' | 'down' | 'same') ?? 'same',
          };
        };

        const spk = Array.isArray(raw['sparkline']) ? raw['sparkline'] : [];

        this.currentProduct = {
          id: raw['id'] as number,
          slug: raw['slug'] as string,
          nameBn: raw['nameBn'] as string,
          categoryNameBn: cat?.['nameBn'] as string,
          categorySlug: cat?.['slug'] as string,
          unitLabel: (u?.['labelBn'] as string) ?? '',
          minPrice: (currentPrice?.['min'] as number) ?? (raw['minPrice'] as number) ?? null,
          maxPrice: (currentPrice?.['max'] as number) ?? (raw['maxPrice'] as number) ?? null,
          delta: (currentPrice?.['changeAmount'] as number) ?? (raw['delta'] as number) ?? null,
          changePct: (currentPrice?.['changePct'] as number) ?? (raw['changePct'] as number) ?? null,
          direction:
            (currentPrice?.['direction'] as 'up' | 'down' | 'same') ??
            (raw['direction'] as 'up' | 'down' | 'same') ??
            'same',
          sparkline: spk.map((s) =>
            typeof s === 'number' ? s : (((s as Record<string, unknown>)?.['mid'] as number) ?? null),
          ),
          imageUrl: resolveProductImage(
            raw['nameBn'] as string,
            (raw['image'] as string) ?? (raw['imageUrl'] as string),
          ),
          today: mapContext(ctx['today']),
          week: mapContext(ctx['weekAgo'] ?? ctx['week']),
          month: mapContext(ctx['monthAgo'] ?? ctx['month']),
          year: mapContext(ctx['yearAgo'] ?? ctx['year']),
        };
      } catch (err) {
        console.error('fetchProductBySlug error:', err);
        this.currentProduct = null;
      } finally {
        this.pdpLoading = false;
      }
    },

    async fetchHistory(slug: string, range = '30d') {
      this.historyRange = range;
      try {
        const api = useApi();
        const encodedSlug = encodeURIComponent(slug);
        const res = await api.get<{ ok: boolean; data: HistoryPoint[] | { points: HistoryPoint[] } }>(
          `/products/${encodedSlug}/history`,
          { range },
        );
        const data = res?.data;
        if (Array.isArray(data)) {
          this.history = data;
        } else if (Array.isArray(data?.points)) {
          this.history = data.points;
        } else {
          this.history = [];
        }
      } catch {
        this.history = [];
      }
    },

    setCategory(slug: string | null) {
      this.activeCategory = slug;
      this.fetchProducts({ resetItems: true });
    },

    setSearch(q: string) {
      this.searchQuery = q;
      this.fetchProducts({ resetItems: true });
    },

    setSort(sort: SortKey) {
      this.sort = sort;
      this.fetchProducts({ resetItems: true });
    },
  },
});
