<script setup lang="ts">
// Stub — reports view
import { ref, onMounted } from 'vue';
import { apiGet } from '../api/client';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

interface Report {
  id: number;
  date: string;
  productCount: number;
  revisionCount: number;
  latestRevisionAt: string | null;
}
const reports = ref<Report[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=30');
    const raw = Array.isArray(res.data) ? res.data : [];
    reports.value = raw.map((r: any) => ({
      id: r.id,
      date: r.reportDate ?? r.date ?? '',
      productCount: r.stats?.parsed ?? r.stats?.matched ?? r.productCount ?? 0,
      revisionCount: 1,
      latestRevisionAt: r.createdAt ?? null,
    }));
  } catch {
    /* non-fatal */
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2 class="page-title">রিপোর্ট তালিকা</h2>
    <div class="table-wrap">
      <table class="data-table" aria-label="রিপোর্ট তালিকা">
        <thead>
          <tr>
            <th>তারিখ</th>
            <th>পণ্য সংখ্যা</th>
            <th>রিভিশন সংখ্যা</th>
            <th>সর্বশেষ আপলোড</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 5" :key="n">
              <td colspan="4"><div class="skeleton-row" /></td>
            </tr>
          </template>
          <tr v-for="r in reports" v-else :key="r.id">
            <td class="font-bn">{{ formatBnDate(r.date) }}</td>
            <td class="font-bn">{{ formatBnInt(r.productCount) }}</td>
            <td class="font-bn">{{ formatBnInt(r.revisionCount) }}</td>
            <td class="text-muted">
              {{ r.latestRevisionAt ? new Date(r.latestRevisionAt).toLocaleString('bn-BD') : '—' }}
            </td>
          </tr>
          <tr v-if="!loading && reports.length === 0">
            <td colspan="4" class="empty-row">কোনো রিপোর্ট পাওয়া যায়নি।</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: var(--space-6);
}
.table-wrap {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: auto;
  box-shadow: var(--shadow-card);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th {
  text-align: left;
  background: var(--color-bg-subtle);
  padding: var(--space-2-5) var(--space-3);
  color: var(--color-text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-subtle);
}
.data-table td {
  padding: var(--space-2-5) var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.skeleton-row {
  height: 24px;
  border-radius: 4px;
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
.empty-row {
  text-align: center;
  padding: var(--space-8) !important;
  color: var(--color-text-muted);
}
.text-muted {
  color: var(--color-text-muted);
}
.font-bn {
  font-family: var(--font-body);
}
</style>
