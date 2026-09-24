// Pinia store for dashboard summary, movers, and index data
import { defineStore } from 'pinia';

export interface DashboardSummary {
  date: string;
  productCount: number;
  risingCount: number;
  fallingCount: number;
  unchangedCount: number;
  noDataCount: number;
  topRisers: TopMover[];
  topFallers: TopMover[];
  latestReportDate: string | null;
}

export interface TopMover {
  id: number;
  slug: string;
  nameBn: string;
  unitLabel: string;
  changePct: number | null;
  direction: 'up' | 'down' | 'same';
  minPrice: number | null;
  maxPrice: number | null;
}

export interface IndexPoint {
  date: string;
  index: number;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null as DashboardSummary | null,
    moversDay: null as { risers: TopMover[]; fallers: TopMover[] } | null,
    indexSeries: [] as IndexPoint[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    latestDate: (state) => state.summary?.date ?? null,
    risingShare: (state) => {
      if (!state.summary) return 0;
      const total = state.summary.productCount;
      return total > 0 ? Math.round((state.summary.risingCount / total) * 100) : 0;
    },
    fallingShare: (state) => {
      if (!state.summary) return 0;
      const total = state.summary.productCount;
      return total > 0 ? Math.round((state.summary.fallingCount / total) * 100) : 0;
    },
  },

  actions: {
    async fetchSummary(date?: string) {
      this.loading = true;
      this.error = null;
      try {
        const api = useApi();
        const res = await api.get<{ ok: boolean; data: Record<string, unknown> }>(
          '/dashboard/summary',
          date ? { date } : {},
        );
        const d = res?.data;
        if (!d) {
          this.summary = null;
          return;
        }
        const rawRisers = (Array.isArray(d['topRisers']) ? d['topRisers'] : []) as Record<string, unknown>[];
        const rawFallers = (Array.isArray(d['topFallers']) ? d['topFallers'] : []) as Record<string, unknown>[];

        this.summary = {
          date: (d['reportDate'] as string) ?? (d['date'] as string) ?? '',
          productCount: (d['totalTracked'] as number) ?? (d['productCount'] as number) ?? 0,
          risingCount: (d['upCount'] as number) ?? (d['risingCount'] as number) ?? 0,
          fallingCount: (d['downCount'] as number) ?? (d['fallingCount'] as number) ?? 0,
          unchangedCount: (d['sameCount'] as number) ?? (d['unchangedCount'] as number) ?? 0,
          noDataCount: (d['noDataCount'] as number) ?? 0,
          topRisers: rawRisers.map((m, idx: number) => ({
            id: (m['id'] as number) ?? idx + 1,
            slug: (m['slug'] as string) ?? '',
            nameBn: (m['nameBn'] as string) ?? '',
            unitLabel: (m['unitLabel'] as string) ?? '',
            changePct: (m['changePct'] as number) ?? null,
            direction: (m['direction'] as 'up' | 'down' | 'same') ?? 'up',
            minPrice: (m['currentMid'] as number) ?? null,
            maxPrice: (m['currentMid'] as number) ?? null,
          })),
          topFallers: rawFallers.map((m, idx: number) => ({
            id: (m['id'] as number) ?? idx + 1,
            slug: (m['slug'] as string) ?? '',
            nameBn: (m['nameBn'] as string) ?? '',
            unitLabel: (m['unitLabel'] as string) ?? '',
            changePct: (m['changePct'] as number) ?? null,
            direction: (m['direction'] as 'up' | 'down' | 'same') ?? 'down',
            minPrice: (m['currentMid'] as number) ?? null,
            maxPrice: (m['currentMid'] as number) ?? null,
          })),
          latestReportDate: (d['reportDate'] as string) ?? (d['latestReportDate'] as string) ?? null,
        };
      } catch (e: unknown) {
        const errObj = e as { status?: number; statusCode?: number; response?: { status?: number } };
        // If 404, there are simply no published reports yet — not a fatal system crash
        if (errObj?.status === 404 || errObj?.statusCode === 404 || errObj?.response?.status === 404) {
          this.summary = null;
        } else {
          this.error = 'ড্যাশবোর্ড ডেটা লোড করা যায়নি।';
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchMovers(period: 'day' | 'week' | 'month' = 'day', date?: string) {
      try {
        const api = useApi();
        const res = await api.get<{ ok: boolean; data: { risers: TopMover[]; fallers: TopMover[] } }>(
          '/dashboard/movers',
          {
            period,
            limit: 6,
            ...(date ? { date } : {}),
          },
        );
        this.moversDay = res.data;
      } catch {
        // non-fatal
      }
    },

    async fetchIndex(category?: string, range = '30d') {
      try {
        const api = useApi();
        const res = await api.get<{ ok: boolean; data: { series: IndexPoint[] } }>('/dashboard/index', {
          range,
          ...(category ? { category } : {}),
        });
        this.indexSeries = res.data.series ?? [];
      } catch {
        // non-fatal
      }
    },
  },
});
