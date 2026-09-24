<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiGet } from '../api/client';
import { formatBnDate, formatBnInt, formatTaka } from '@ajkerbazardor/shared';

interface Summary {
  date: string;
  productCount: number;
  risingCount: number;
  fallingCount: number;
  unchangedCount: number;
  noDataCount: number;
  topRisers: Mover[];
  topFallers: Mover[];
}

interface Mover {
  id?: number;
  slug: string;
  nameBn: string;
  unitLabel?: string;
  changePct: number | null;
  direction: string;
  price: number | null;
}

interface RecentRevision {
  id: number;
  date: string;
  productCount: number;
  createdAt: string;
}

const summary = ref<Summary | null>(null);
const revisions = ref<RecentRevision[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    const sumRes = await apiGet<{ ok: boolean; data: any }>('/dashboard/summary');
    const rawSum = sumRes?.data;
    if (rawSum) {
      summary.value = {
        date: rawSum.reportDate ?? rawSum.date ?? '',
        productCount: rawSum.totalTracked ?? rawSum.productCount ?? 0,
        risingCount: rawSum.upCount ?? rawSum.risingCount ?? 0,
        fallingCount: rawSum.downCount ?? rawSum.fallingCount ?? 0,
        unchangedCount: rawSum.sameCount ?? rawSum.unchangedCount ?? 0,
        noDataCount: rawSum.noDataCount ?? 0,
        topRisers: (rawSum.topRisers ?? []).map((m: any) => ({
          id: m.id,
          slug: m.slug,
          nameBn: m.nameBn,
          unitLabel: m.unitLabel,
          changePct: m.changePct ?? null,
          direction: m.direction ?? 'up',
          price: m.currentMid ?? m.minPrice ?? null,
        })),
        topFallers: (rawSum.topFallers ?? []).map((m: any) => ({
          id: m.id,
          slug: m.slug,
          nameBn: m.nameBn,
          unitLabel: m.unitLabel,
          changePct: m.changePct ?? null,
          direction: m.direction ?? 'down',
          price: m.currentMid ?? m.minPrice ?? null,
        })),
      };
    }
  } catch (err) {
    console.error('Failed to load dashboard summary:', err);
  }

  try {
    const revRes = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=5');
    const rawRevs = Array.isArray(revRes?.data) ? revRes.data : [];
    revisions.value = rawRevs.map((r: any) => ({
      id: r.id,
      date: r.reportDate ?? r.date ?? '',
      productCount: r.stats?.parsed ?? r.stats?.matched ?? r.productCount ?? 0,
      createdAt: r.createdAt ?? '',
    }));
  } catch (err) {
    console.error('Failed to load revisions:', err);
  }

  if (!summary.value) {
    error.value = 'ড্যাশবোর্ড লোড করা যায়নি।';
  }
  loading.value = false;
});
</script>

<template>
  <div class="dashboard">
    <!-- Error -->
    <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="dashboard__skeleton-grid">
      <div v-for="n in 4" :key="n" class="skeleton-tile" />
    </div>

    <!-- Content -->
    <template v-else-if="summary">
      <!-- Date headline -->
      <div class="dashboard__heading">
        <h2 class="dashboard__date">{{ summary.date ? formatBnDate(summary.date) : 'আজকের বাজার' }}</h2>
        <span class="dashboard__label">সর্বশেষ রিপোর্ট</span>
      </div>

      <!-- Stat tiles -->
      <div class="stat-grid">
        <div class="stat-tile">
          <span class="stat-tile__value">{{ formatBnInt(summary.productCount) }}</span>
          <span class="stat-tile__label">মোট পণ্য</span>
        </div>
        <div class="stat-tile stat-tile--up">
          <span class="stat-tile__value">{{ formatBnInt(summary.risingCount) }}</span>
          <span class="stat-tile__label">মূল্য বেড়েছে</span>
        </div>
        <div class="stat-tile stat-tile--down">
          <span class="stat-tile__value">{{ formatBnInt(summary.fallingCount) }}</span>
          <span class="stat-tile__label">মূল্য কমেছে</span>
        </div>
        <div class="stat-tile">
          <span class="stat-tile__value">{{ formatBnInt(summary.unchangedCount) }}</span>
          <span class="stat-tile__label">অপরিবর্তিত</span>
        </div>
      </div>

      <!-- Two-column: movers + recent uploads -->
      <div class="dashboard__lower">
        <!-- Top Risers -->
        <section class="panel">
          <h3 class="panel__title panel__title--up">↑ সবচেয়ে বেশি বেড়েছে</h3>
          <table class="movers-table" aria-label="বেশি বেড়েছে">
            <thead>
              <tr>
                <th>পণ্য</th>
                <th>দাম</th>
                <th>পরিবর্তন</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in summary.topRisers.slice(0, 6)" :key="m.slug || m.id">
                <td class="movers-table__name">{{ m.nameBn }}</td>
                <td>{{ m.price !== null ? formatTaka(m.price) : '—' }}</td>
                <td class="text-up">{{ m.changePct !== null ? `+${m.changePct.toFixed(1)}%` : '—' }}</td>
              </tr>
              <tr v-if="summary.topRisers.length === 0">
                <td colspan="3" class="text-muted" style="text-align: center; padding: 1rem">
                  কোনো মূল্য বৃদ্ধির তথ্য নেই
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Top Fallers -->
        <section class="panel">
          <h3 class="panel__title panel__title--down">↓ সবচেয়ে বেশি কমেছে</h3>
          <table class="movers-table" aria-label="বেশি কমেছে">
            <thead>
              <tr>
                <th>পণ্য</th>
                <th>দাম</th>
                <th>পরিবর্তন</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in summary.topFallers.slice(0, 6)" :key="m.slug || m.id">
                <td class="movers-table__name">{{ m.nameBn }}</td>
                <td>{{ m.price !== null ? formatTaka(m.price) : '—' }}</td>
                <td class="text-down">{{ m.changePct !== null ? `${m.changePct.toFixed(1)}%` : '—' }}</td>
              </tr>
              <tr v-if="summary.topFallers.length === 0">
                <td colspan="3" class="text-muted" style="text-align: center; padding: 1rem">
                  কোনো মূল্য হ্রাসের তথ্য নেই
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Recent Revisions -->
        <section class="panel panel--full">
          <h3 class="panel__title">সাম্প্রতিক আপলোড</h3>
          <table class="movers-table" aria-label="সাম্প্রতিক রিভিশন">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>পণ্য সংখ্যা</th>
                <th>আপলোড সময়</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rev in revisions" :key="rev.id">
                <td class="font-bn">{{ formatBnDate(rev.date) }}</td>
                <td>{{ formatBnInt(rev.productCount) }}</td>
                <td class="text-muted">{{ new Date(rev.createdAt).toLocaleString('bn-BD') }}</td>
              </tr>
              <tr v-if="revisions.length === 0">
                <td colspan="3" class="text-muted" style="text-align: center; padding: 1rem">
                  কোনো আপলোড পাওয়া যায়নি।
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard__heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.dashboard__date {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.dashboard__label {
  font-size: var(--text-sm);
  color: var(--color-brand-primary);
  font-weight: 600;
}

/* Stat Grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-tile {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--duration-fast);
}

.stat-tile:hover {
  box-shadow: var(--shadow-card-hover);
}

.stat-tile--up {
  border-color: var(--color-trend-up-border);
  background: var(--color-trend-up-bg);
}

.stat-tile--down {
  border-color: var(--color-trend-down-border);
  background: var(--color-trend-down-bg);
}

.stat-tile__value {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.stat-tile--up .stat-tile__value {
  color: var(--color-trend-up);
}
.stat-tile--down .stat-tile__value {
  color: var(--color-trend-down);
}

.stat-tile__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Lower section */
.dashboard__lower {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

/* Skeleton */
.dashboard__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.skeleton-tile {
  height: 120px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Panel */
.panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.panel--full {
  grid-column: 1 / -1;
}

.panel__title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  margin-bottom: var(--space-3);
}

.panel__title--up {
  color: var(--color-trend-up);
}
.panel__title--down {
  color: var(--color-trend-down);
}

/* Movers table */
.movers-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: var(--text-sm);
}

.movers-table th {
  text-align: left;
  color: var(--color-text-muted);
  font-weight: 600;
  padding: var(--space-1-5) var(--space-2);
  border-bottom: 1px solid var(--color-border-subtle);
}

.movers-table td {
  padding: var(--space-1-5) var(--space-2);
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
}

.movers-table tr:last-child td {
  border-bottom: none;
}

.movers-table__name {
  font-family: var(--font-body);
  font-weight: 500;
}

/* Alert */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
}

/* Utility */
.text-up {
  color: var(--color-trend-up);
  font-weight: 700;
}
.text-down {
  color: var(--color-trend-down);
  font-weight: 700;
}
.text-muted {
  color: var(--color-text-muted);
}
.font-bn {
  font-family: var(--font-body);
}
</style>
