<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { apiGet } from '../api/client';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

interface Report {
  id: number;
  date: string;
  productCount: number;
  revisionCount: number;
  latestRevisionAt: string | null;
  fileName?: string | undefined;
  sha256?: string | undefined;
}

const reports = ref<Report[]>([]);
const loading = ref(true);
const searchQuery = ref('');

async function fetchReports() {
  loading.value = true;
  try {
    const res = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=50');
    const raw = Array.isArray(res.data) ? res.data : [];
    reports.value = raw.map((r: any) => {
      let statsObj: any = {};
      try {
        statsObj = typeof r.stats === 'string' ? JSON.parse(r.stats) : (r.stats ?? {});
      } catch {
        statsObj = {};
      }
      return {
        id: r.id,
        date: r.reportDate ?? r.date ?? '',
        productCount: statsObj.productCount ?? statsObj.parsed ?? r.productCount ?? 0,
        revisionCount: 1,
        latestRevisionAt: r.createdAt ?? null,
        fileName: r.fileName ?? 'টিসিবি দৈনিক দর বুলেটিন',
        sha256: r.sha256 ? `${r.sha256.slice(0, 10)}…` : undefined,
      };
    });
  } catch (err) {
    console.error('Failed to load reports:', err);
  } finally {
    loading.value = false;
  }
}

const filteredReports = computed(() => {
  if (!searchQuery.value.trim()) return reports.value;
  const q = searchQuery.value.trim().toLowerCase();
  return reports.value.filter(
    (r) =>
      r.date.toLowerCase().includes(q) ||
      formatBnDate(r.date).toLowerCase().includes(q) ||
      (r.fileName && r.fileName.toLowerCase().includes(q)),
  );
});

const totalProductsCount = computed(() => {
  return reports.value.reduce((acc, r) => acc + (r.productCount || 0), 0);
});

const latestDate = computed(() => {
  return reports.value[0]?.date ? formatBnDate(reports.value[0].date) : '—';
});

onMounted(() => {
  fetchReports();
});
</script>

<template>
  <div class="reports-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <span class="header-badge">📋 বুলেটিন ডাটাবেস ও আর্কাইভ</span>
        <h1 class="page-title">টিসিবি দৈনিক রিপোর্ট তালিকা</h1>
        <p class="page-subtitle">
          জাতীয় ট্রেডিং কর্পোরেশন অব বাংলাদেশ (টিসিবি) থেকে সংগৃহীত ও প্রক্রিয়াজাতকৃত মূল্য তালিকার ইতিহাস
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn--refresh" :disabled="loading" title="রিফ্রেশ করুন" @click="fetchReports">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          রিফ্রেশ
        </button>
        <RouterLink to="/upload" class="btn btn--coral">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          নতুন বুলেটিন আপলোড
        </RouterLink>
      </div>
    </header>

    <!-- Top Summary Stat Cards (Athenaeum Style) -->
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">মোট সংরক্ষিত বুলেটিন</span>
          <span class="stat-val font-bn">{{ formatBnInt(reports.length) }} টি</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">সর্বশেষ বুলেটিন তারিখ</span>
          <span class="stat-val font-bn">{{ latestDate }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap stat-icon--cyan">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">সর্বমোট এন্ট্রি রেকর্ডস</span>
          <span class="stat-val font-bn">{{ formatBnInt(totalProductsCount) }} টি</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="filter-bar">
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
          placeholder="তারিখ বা বুলেটিনের নাম লিখে খুঁজুন…"
          class="search-input"
        />
      </div>
      <span class="count-pill font-bn"> মোট {{ formatBnInt(filteredReports.length) }} টি রিপোর্ট প্রদর্শিত </span>
    </div>

    <!-- Athenaeum Data Table Card -->
    <div class="table-wrap">
      <table class="data-table" aria-label="রিপোর্ট তালিকা">
        <thead>
          <tr>
            <th>বুলেটিন তারিখ</th>
            <th>ফাইলের নাম</th>
            <th>পণ্য সংখ্যা</th>
            <th>ভ্যালিডেশন</th>
            <th>সর্বশেষ আপলোড</th>
            <th>অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading Skeletons -->
          <template v-if="loading">
            <tr v-for="n in 6" :key="n" class="skeleton-row-wrap">
              <td colspan="6"><div class="skeleton-shimmer" /></td>
            </tr>
          </template>

          <!-- Data Rows -->
          <tr v-for="r in filteredReports" v-else :key="r.id" class="report-row">
            <td>
              <div class="date-cell">
                <span class="date-dot" />
                <span class="date-text font-bn">{{ formatBnDate(r.date) }}</span>
              </div>
            </td>
            <td>
              <div class="file-cell">
                <span class="file-name">{{ r.fileName }}</span>
                <span v-if="r.sha256" class="hash-tag font-mono">{{ r.sha256 }}</span>
              </div>
            </td>
            <td>
              <span class="product-badge font-bn"> {{ formatBnInt(r.productCount) }} টি পণ্য </span>
            </td>
            <td>
              <span class="badge badge--success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                যাচাইকৃত
              </span>
            </td>
            <td class="text-secondary font-bn">
              {{ r.latestRevisionAt ? new Date(r.latestRevisionAt).toLocaleString('bn-BD') : '—' }}
            </td>
            <td>
              <RouterLink to="/workflow/imports" class="row-action-btn"> বিস্তারিত ↗ </RouterLink>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && filteredReports.length === 0">
            <td colspan="6" class="empty-state-cell">
              <div class="empty-content">
                <span class="empty-icon">📂</span>
                <p class="empty-title">কোনো রিপোর্ট পাওয়া যায়নি</p>
                <p class="empty-sub">অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন বুলেটিন আপলোড করুন।</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
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

.btn--coral {
  background: var(--color-coral-gradient);
  color: #fff;
  box-shadow: var(--color-coral-glow);
}

.btn--coral:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(244, 68, 46, 0.35);
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
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
  border: 1px solid #a7f3d0;
}

.stat-icon--cyan {
  background: var(--color-accent-cyan-subtle);
  color: var(--color-accent-cyan);
  border: 1px solid #bae6fd;
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
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-top: 0.25rem;
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

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 440px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
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

.count-pill {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border-subtle);
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

.report-row {
  transition: background-color 0.15s ease;
}

.report-row:hover td {
  background-color: #faf6f0;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Cells */
.date-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.date-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-coral-primary);
  box-shadow: 0 0 0 3px var(--color-coral-subtle);
}

.date-text {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.file-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.file-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.hash-tag {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.product-badge {
  font-size: var(--text-sm);
  font-weight: 700;
  color: #1f2937;
  background: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  display: inline-block;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
}

.badge--success {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border: 1px solid var(--color-trend-down-border);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.row-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
  border: 1px solid var(--color-coral-border);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.row-action-btn:hover {
  background: var(--color-coral-primary);
  color: #fff;
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

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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
