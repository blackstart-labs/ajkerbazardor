<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiGet } from '../api/client';
import { formatBnDate } from '@ajkerbazardor/shared';

interface AuditEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  changes: unknown;
  createdAt: string;
  performedBy: string | null;
}

const entries = ref<AuditEntry[]>([]);
const loading = ref(true);
const page = ref(1);
const hasMore = ref(true);
const limit = 50;

onMounted(() => loadAudit());

async function loadAudit(reset = false) {
  if (reset) {
    page.value = 1;
    entries.value = [];
  }
  loading.value = true;
  try {
    const res = await apiGet<{ ok: boolean; data: AuditEntry[] }>(
      `/admin/audit?limit=${limit}&offset=${(page.value - 1) * limit}`,
    );
    const rows = res.data ?? [];
    if (reset) entries.value = rows;
    else entries.value = [...entries.value, ...rows];
    hasMore.value = rows.length === limit;
  } catch {
    /* non-fatal */
  } finally {
    loading.value = false;
  }
}

function actionClass(action: string) {
  if (action.includes('delete') || action.includes('undo')) return 'badge badge--danger';
  if (action.includes('create') || action.includes('import')) return 'badge badge--success';
  return 'badge badge--neutral';
}
</script>

<template>
  <div>
    <h2 class="page-title">অডিট লগ</h2>
    <div class="table-wrap">
      <table class="data-table" aria-label="অডিট লগ">
        <thead>
          <tr>
            <th>সময়</th>
            <th>কার্যক্রম</th>
            <th>টেবিল</th>
            <th>ID</th>
            <th>ব্যবহারকারী</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading && entries.length === 0">
            <tr v-for="n in 5" :key="n">
              <td colspan="5"><div class="skeleton-row" /></td>
            </tr>
          </template>
          <tr v-for="e in entries" :key="e.id">
            <td class="text-muted text-sm">{{ new Date(e.createdAt).toLocaleString('bn-BD') }}</td>
            <td>
              <span :class="actionClass(e.action)">{{ e.action }}</span>
            </td>
            <td class="text-muted">{{ e.entityType }}</td>
            <td class="text-muted">{{ e.entityId ?? '—' }}</td>
            <td class="text-muted">{{ e.performedBy ?? '—' }}</td>
          </tr>
          <tr v-if="!loading && entries.length === 0">
            <td colspan="5" class="empty-row">কোনো অডিট লগ পাওয়া যায়নি।</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="hasMore" class="load-more">
      <button
        type="button"
        class="page-btn"
        :disabled="loading"
        @click="
          page++;
          loadAudit();
        "
      >
        আরো লোড করুন
      </button>
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
  white-space: nowrap;
}
.data-table td {
  padding: var(--space-2-5) var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}
.badge--success {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
}
.badge--danger {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
}
.badge--neutral {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
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
.load-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
}
.page-btn {
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-surface);
  color: var(--color-brand-primary);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.text-muted {
  color: var(--color-text-muted);
}
.text-sm {
  font-size: var(--text-sm);
}
</style>
