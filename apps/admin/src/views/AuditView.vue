<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiGet } from '../api/client';
import { formatBnInt } from '@ajkerbazardor/shared';

interface AuditEntry {
  id: number;
  action: string;
  entityType?: string;
  entity?: string;
  entityId: number | null;
  changes: unknown;
  createdAt?: string;
  at?: string;
  performedBy: string | null;
  userEmail?: string;
  userId?: number;
}

const entries = ref<AuditEntry[]>([]);
const loading = ref(true);
const page = ref(1);
const hasMore = ref(true);
const limit = 50;
const activeFilter = ref<'all' | 'create' | 'update' | 'delete'>('all');
const searchQuery = ref('');

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
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  } finally {
    loading.value = false;
  }
}

const filteredEntries = computed(() => {
  let list = entries.value;
  if (activeFilter.value === 'create') {
    list = list.filter((e) => e.action.includes('create') || e.action.includes('import'));
  } else if (activeFilter.value === 'delete') {
    list = list.filter((e) => e.action.includes('delete') || e.action.includes('undo'));
  } else if (activeFilter.value === 'update') {
    list = list.filter((e) => e.action.includes('update') || e.action.includes('edit'));
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        (e.entityType && e.entityType.toLowerCase().includes(q)) ||
        (e.entity && e.entity.toLowerCase().includes(q)) ||
        (e.performedBy && e.performedBy.toLowerCase().includes(q)) ||
        (e.userEmail && e.userEmail.toLowerCase().includes(q)),
    );
  }

  return list;
});

function actionBadgeClass(action: string) {
  if (action.includes('delete') || action.includes('undo')) return 'action-badge action-badge--danger';
  if (action.includes('create') || action.includes('import')) return 'action-badge action-badge--success';
  if (action.includes('update') || action.includes('edit')) return 'action-badge action-badge--warning';
  return 'action-badge action-badge--neutral';
}

function formatAuditDate(val?: string): string {
  if (!val) return '—';
  try {
    const d = new Date(val.replace(' ', 'T'));
    return isNaN(d.getTime())
      ? val
      : d.toLocaleString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  } catch {
    return val;
  }
}

function formatAuditUser(e: AuditEntry): string {
  if (e.performedBy) return e.performedBy;
  if (e.userEmail) return e.userEmail;
  if (e.userId) return `ব্যবহারকারী #${e.userId}`;
  return 'সিস্টেম অটোমেশন';
}

function getUserInitials(name: string): string {
  if (!name || name === 'সিস্টেম অটোমেশন') return 'SY';
  return name.slice(0, 2).toUpperCase();
}
</script>

<template>
  <div class="audit-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <span class="header-badge">🛡️ সিকিউরিটি ও পরিবর্তন ট্র্যাকিং</span>
        <h1 class="page-title">সিস্টেম অডিট লগ</h1>
        <p class="page-subtitle">
          প্রশাসনিক ও ডাটাবেস সম্পর্কিত সকল কার্যক্রমের অপরিবর্তনীয় ও বিস্তারিত টাইমলাইন রেকর্ড
        </p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn btn--refresh"
          :disabled="loading"
          title="রিফ্রেশ করুন"
          @click="loadAudit(true)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          রিফ্রেশ
        </button>
      </div>
    </header>

    <!-- Top Summary Stat Cards -->
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">মোট অডিট রেকর্ড</span>
          <span class="stat-val font-bn">{{ formatBnInt(entries.length) }} টি</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">সিস্টেম ইন্টিগ্রিটি</span>
          <span class="stat-val text-success">নিরাপদ ও সক্রিয়</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">সর্বশেষ রেকর্ড</span>
          <span class="stat-val font-bn text-sm">{{ formatAuditDate(entries[0]?.createdAt ?? entries[0]?.at) }}</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="filter-bar">
      <!-- Action Filter Pills -->
      <div class="filter-pills" role="tablist">
        <button
          type="button"
          class="pill-btn"
          :class="{ 'pill-btn--active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          সব কার্যক্রম
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ 'pill-btn--active': activeFilter === 'create' }"
          @click="activeFilter = 'create'"
        >
          নতুন সংযোজন (Create)
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ 'pill-btn--active': activeFilter === 'update' }"
          @click="activeFilter = 'update'"
        >
          সম্পাদনা (Update)
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ 'pill-btn--active': activeFilter === 'delete' }"
          @click="activeFilter = 'delete'"
        >
          বাতিল / ডিলিট (Delete)
        </button>
      </div>

      <div class="search-wrap">
        <svg
          class="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="কার্যক্রম বা ব্যবহারকারী লিখে খুঁজুন…"
          class="search-input"
        />
      </div>
    </div>

    <!-- Athenaeum Data Table Card -->
    <div class="table-wrap">
      <table class="data-table" aria-label="অডিট লগ তালিকা">
        <thead>
          <tr>
            <th>সময়</th>
            <th>কার্যক্রম (Action)</th>
            <th>টার্গেট টেবিল / এনটিটি</th>
            <th>এনটিটি আইডি</th>
            <th>সম্পাদনাকারী ব্যবহারকারী</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading Skeletons -->
          <template v-if="loading && entries.length === 0">
            <tr v-for="n in 6" :key="n" class="skeleton-row-wrap">
              <td colspan="5"><div class="skeleton-shimmer" /></td>
            </tr>
          </template>

          <!-- Audit Rows -->
          <tr v-for="e in filteredEntries" v-else :key="e.id" class="audit-row">
            <td>
              <div class="time-cell">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span class="font-bn">{{ formatAuditDate(e.createdAt ?? e.at) }}</span>
              </div>
            </td>
            <td>
              <span :class="actionBadgeClass(e.action)">{{ e.action }}</span>
            </td>
            <td>
              <span class="entity-pill font-mono">{{ e.entityType ?? e.entity ?? '—' }}</span>
            </td>
            <td>
              <span class="id-badge font-mono font-bn">#{{ e.entityId ?? '—' }}</span>
            </td>
            <td>
              <div class="user-cell">
                <span class="user-avatar">{{ getUserInitials(formatAuditUser(e)) }}</span>
                <span class="user-name">{{ formatAuditUser(e) }}</span>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && filteredEntries.length === 0">
            <td colspan="5" class="empty-state-cell">
              <div class="empty-content">
                <span class="empty-icon">🛡️</span>
                <p class="empty-title">কোনো অডিট লগ পাওয়া যায়নি</p>
                <p class="empty-sub">ফিল্টার রিসেট করে আবার চেষ্টা করুন।</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore" class="load-more-section">
      <button
        type="button"
        class="load-more-btn"
        :disabled="loading"
        @click="
          page++;
          loadAudit();
        "
      >
        <span v-if="loading" class="spinner" />
        {{ loading ? 'লোড হচ্ছে…' : 'আরো অডিট লগ লোড করুন' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.header-badge {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
  border: 1px solid var(--color-coral-border);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.25;
  margin: 0;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: 0.35rem;
  max-width: 680px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  font-weight: 700;
  height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
}

.btn--refresh {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border-strong);
}

.btn--refresh:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
  border-color: #d1c5b4;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  padding: 1.5rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: var(--card-shadow);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon--coral {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
}

.stat-icon--green {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border: 1px solid var(--color-trend-down-border);
}

.stat-icon--purple {
  background: var(--color-accent-purple-subtle);
  color: var(--color-accent-purple);
  border: 1px solid #ddd6fe;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-top: 0.25rem;
}

.text-success {
  color: var(--color-trend-down);
}

.text-sm {
  font-size: 0.9375rem !important;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-btn {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.pill-btn--active {
  background: var(--color-coral-gradient) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 4px 14px rgba(244, 68, 46, 0.25);
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 42px;
  padding-left: 2.75rem;
  padding-right: 1.25rem;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-strong);
  border-radius: 9999px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--color-coral-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.15);
}

/* Table Wrap */
.table-wrap {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th {
  text-align: left;
  background: var(--color-bg-canvas);
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px 22px;
  border-bottom: 1.5px solid var(--color-border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.audit-row {
  transition: background-color 0.15s ease;
}

.audit-row:hover td {
  background-color: #faf6f0;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Cells */
.time-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
}

.time-cell svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.action-badge {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.action-badge--success {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border: 1px solid var(--color-trend-down-border);
}

.action-badge--danger {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
}

.action-badge--warning {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.action-badge--neutral {
  background: var(--color-bg-canvas);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-subtle);
}

.entity-pill {
  font-size: 0.8125rem;
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--color-border-subtle);
}

.id-badge {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  background: var(--color-bg-canvas);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  height: 44px;
  padding: 0 1.75rem;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border-strong);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-coral-primary);
  color: var(--color-coral-primary);
  transform: translateY(-1px);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: var(--color-coral-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Skeletons */
.skeleton-row-wrap td {
  padding: 16px 22px;
}

.skeleton-shimmer {
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f5ede4 25%, #faf6f0 50%, #f5ede4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Empty State */
.empty-state-cell {
  text-align: center;
  padding: 4rem 2rem !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 2.75rem;
  margin-bottom: 0.75rem;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.35rem;
}

.empty-sub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
