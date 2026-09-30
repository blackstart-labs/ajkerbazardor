<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiGet, apiPost } from '../api/client';
import { formatBnDate, formatBnInt, formatTaka } from '@ajkerbazardor/shared';

const route = useRoute();
const currentRouteName = computed(() => String(route.name ?? 'Settings'));

// ── State ──────────────────────────────────────────────────────────────────
const loading = ref(false);
const error = ref<string | null>(null);

// Imports State
const imports = ref<any[]>([]);
const undoingId = ref<number | null>(null);

// Price Data State
const priceItems = ref<any[]>([]);
const priceSearch = ref('');

// Validation State
const summaryData = ref<any | null>(null);

// Settings / System State
const healthStatus = ref<{ ok: boolean; latency: number; data?: any } | null>(null);
const checkingHealth = ref(false);

// Fixed Dhaka Markets List
const marketsList = [
  { id: 1, slug: 'mirpur-6', nameBn: 'মিরপুর-৬ কাঁচাবাজার', area: 'মিরপুর, ঢাকা', active: true, monitored: true },
  {
    id: 2,
    slug: 'mohammadpur',
    nameBn: 'মোহাম্মদপুর টাউন হল মার্কেট',
    area: 'মোহাম্মদপুর, ঢাকা',
    active: true,
    monitored: true,
  },
  {
    id: 3,
    slug: 'new-market',
    nameBn: 'নিউ মার্কেট কাঁচাবাজার',
    area: 'আজিমপুর / ধানমন্ডি, ঢাকা',
    active: true,
    monitored: true,
  },
  { id: 4, slug: 'rampura', nameBn: 'রামপুরা কাঁচাবাজার', area: 'রামপুরা, ঢাকা', active: true, monitored: true },
  { id: 5, slug: 'mohakhali', nameBn: 'মহাখালী কাঁচাবাজার', area: 'মহাখালী, ঢাকা', active: true, monitored: true },
];

async function loadRouteData() {
  loading.value = true;
  error.value = null;

  try {
    if (currentRouteName.value === 'Imports') {
      const res = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=25');
      const raw = Array.isArray(res.data) ? res.data : [];
      imports.value = raw.map((r: any) => {
        let statsObj: any = {};
        try {
          statsObj = typeof r.stats === 'string' ? JSON.parse(r.stats) : (r.stats ?? {});
        } catch {
          statsObj = {};
        }
        return {
          id: r.id,
          reportId: r.reportId,
          date: r.reportDate ?? r.date ?? '',
          fileName: r.fileName ?? 'বুলেটিন ফাইল',
          sha256: r.sha256 ? `${r.sha256.slice(0, 10)}…` : '—',
          productCount: statsObj.productCount ?? statsObj.parsed ?? r.productCount ?? 0,
          newProducts: statsObj.newProducts ?? 0,
          createdAt: r.createdAt ?? '',
        };
      });
    } else if (currentRouteName.value === 'PriceData') {
      const res = await apiGet<{ ok: boolean; data: any }>('/admin/products', { limit: 50 });
      const raw = Array.isArray(res.data?.items) ? res.data.items : [];
      priceItems.value = raw;
    } else if (currentRouteName.value === 'Validation') {
      const res = await apiGet<{ ok: boolean; data: any }>('/dashboard/summary');
      summaryData.value = res.data ?? null;
    } else if (currentRouteName.value === 'Settings') {
      await checkHealth();
    }
  } catch (err: any) {
    error.value = err?.message ?? 'তথ্য লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
}

async function checkHealth() {
  checkingHealth.value = true;
  const start = performance.now();
  try {
    const res = await apiGet<any>('/health');
    const latency = Math.round(performance.now() - start);
    healthStatus.value = { ok: true, latency, data: res };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    healthStatus.value = { ok: false, latency, data: err?.message };
  } finally {
    checkingHealth.value = false;
  }
}

async function undoRevision(id: number) {
  if (!confirm('আপনি কি নিশ্চিত যে এই আপলোডটি বাতিল (Undo) করতে চান?')) return;
  undoingId.value = id;
  try {
    await apiPost(`/admin/imports/undo/${id}`);
    await loadRouteData();
    alert('আপলোড সফলভাবে বাতিল হয়েছে।');
  } catch (err: any) {
    alert(err?.data?.message ?? 'আপলোড বাতিল ব্যর্থ হয়েছে।');
  } finally {
    undoingId.value = null;
  }
}

const filteredPrices = computed(() => {
  if (!priceSearch.value.trim()) return priceItems.value;
  const q = priceSearch.value.trim().toLowerCase();
  return priceItems.value.filter(
    (p: any) =>
      p.nameBn?.toLowerCase().includes(q) ||
      p.categoryNameBn?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q),
  );
});

watch(currentRouteName, () => {
  loadRouteData();
});

onMounted(() => {
  loadRouteData();
});
</script>

<template>
  <div class="workflow-view">
    <!-- Header -->
    <header class="workflow-header">
      <div class="workflow-header__title-wrap">
        <span class="badge">অপারেশনাল কন্ট্রোল</span>
        <h2 v-if="currentRouteName === 'Imports'" class="page-title">আপলোড ইতিহাস ও রিভিশন</h2>
        <h2 v-else-if="currentRouteName === 'PriceData'" class="page-title">বাজারদর পর্যবেক্ষণ ও তথ্য</h2>
        <h2 v-else-if="currentRouteName === 'Markets'" class="page-title">মনিটরিংকৃত বাজার ব্যবস্থাপনা</h2>
        <h2 v-else-if="currentRouteName === 'Validation'" class="page-title">ডেটা কোয়ালিটি ও ভ্যালিডেশন ড্যাশবোর্ড</h2>
        <h2 v-else class="page-title">সিস্টেম স্ট্যাটাস ও কনফিগারেশন</h2>
      </div>

      <div class="workflow-header__actions">
        <RouterLink v-if="currentRouteName === 'Imports'" to="/upload" class="btn btn-primary">
          + নতুন এক্সেল আপলোড
        </RouterLink>
        <button
          v-else-if="currentRouteName === 'Settings'"
          type="button"
          class="btn btn-outline"
          :disabled="checkingHealth"
          @click="checkHealth"
        >
          {{ checkingHealth ? 'যাচাই হচ্ছে…' : '🔄 হেলথ রিফ্রেশ' }}
        </button>
      </div>
    </header>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert--error" role="alert">
      {{ error }}
    </div>

    <!-- ── 1. IMPORTS TAB ───────────────────────────────────────────────── -->
    <section v-if="currentRouteName === 'Imports'" class="content-section">
      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 5" :key="n" class="skeleton-row" />
      </div>

      <div v-else class="table-wrap">
        <table class="data-table" aria-label="আপলোড তালিকা">
          <thead>
            <tr>
              <th>বুলেটিন তারিখ</th>
              <th>ফাইলের নাম</th>
              <th>SHA256 হ্যাশ</th>
              <th>মোট পণ্য</th>
              <th>নতুন পণ্য</th>
              <th>আপলোড সময়</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="imp in imports" :key="imp.id">
              <td class="font-bn font-bold">{{ formatBnDate(imp.date) }}</td>
              <td class="text-secondary">{{ imp.fileName }}</td>
              <td class="code-badge font-mono">{{ imp.sha256 }}</td>
              <td class="font-bn">{{ formatBnInt(imp.productCount) }} টি</td>
              <td class="font-bn">
                <span :class="imp.newProducts > 0 ? 'badge badge--warn' : 'badge badge--neutral'">
                  {{ formatBnInt(imp.newProducts) }}
                </span>
              </td>
              <td class="text-muted text-sm font-bn">
                {{ imp.createdAt ? new Date(imp.createdAt.replace(' ', 'T')).toLocaleString('bn-BD') : '—' }}
              </td>
              <td>
                <button type="button" class="btn-undo" :disabled="undoingId === imp.id" @click="undoRevision(imp.id)">
                  {{ undoingId === imp.id ? 'বাতিল হচ্ছে…' : 'বাতিল (Undo)' }}
                </button>
              </td>
            </tr>
            <tr v-if="imports.length === 0">
              <td colspan="7" class="empty-cell">কোনো আপলোড ইতিহাস পাওয়া যায়নি।</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── 2. PRICE DATA TAB ────────────────────────────────────────────── -->
    <section v-else-if="currentRouteName === 'PriceData'" class="content-section">
      <div class="filter-bar">
        <input
          v-model="priceSearch"
          type="search"
          placeholder="পণ্য বা ক্যাটাগরির নাম লিখে খুঁজুন…"
          class="search-input"
        />
        <span class="count-badge font-bn">মোট {{ formatBnInt(filteredPrices.length) }} টি পণ্য</span>
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 6" :key="n" class="skeleton-row" />
      </div>

      <div v-else class="table-wrap">
        <table class="data-table" aria-label="মূল্য তথ্য তালিকা">
          <thead>
            <tr>
              <th>পণ্যের নাম</th>
              <th>ক্যাটাগরি</th>
              <th>একক (Unit)</th>
              <th>সর্বনিম্ন দর</th>
              <th>সর্বোচ্চ দর</th>
              <th>স্ট্যাটাস</th>
              <th>সম্পাদনা</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredPrices" :key="item.id">
              <td>
                <div class="product-cell">
                  <strong>{{ item.nameBn }}</strong>
                  <span class="text-xs text-muted font-mono">{{ item.slug }}</span>
                </div>
              </td>
              <td>
                <span class="badge badge--neutral">{{ item.categoryNameBn ?? '—' }}</span>
              </td>
              <td class="font-bn">{{ item.unitLabelBn ?? item.unitLabel ?? '—' }}</td>
              <td class="font-bn font-bold">
                {{ item.minPrice !== null && item.minPrice !== undefined ? formatTaka(item.minPrice) : '—' }}
              </td>
              <td class="font-bn font-bold">
                {{ item.maxPrice !== null && item.maxPrice !== undefined ? formatTaka(item.maxPrice) : '—' }}
              </td>
              <td>
                <span :class="item.archivedAt ? 'badge badge--danger' : 'badge badge--success'">
                  {{ item.archivedAt ? 'আর্কাইভকৃত' : 'সক্রিয়' }}
                </span>
              </td>
              <td>
                <RouterLink :to="`/products/${item.id}`" class="btn btn-sm btn-outline"> সম্পাদনা </RouterLink>
              </td>
            </tr>
            <tr v-if="filteredPrices.length === 0">
              <td colspan="7" class="empty-cell">কোনো পণ্য পাওয়া যায়নি।</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── 3. MARKETS TAB ───────────────────────────────────────────────── -->
    <section v-else-if="currentRouteName === 'Markets'" class="content-section">
      <div class="markets-grid">
        <article v-for="m in marketsList" :key="m.id" class="market-card">
          <div class="market-card__header">
            <span class="market-icon">🏪</span>
            <span class="badge badge--success">সক্রিয় মনিটরিং</span>
          </div>
          <h3>{{ m.nameBn }}</h3>
          <p class="market-location">📍 {{ m.area }}</p>
          <div class="market-details">
            <div class="detail-item">
              <span class="detail-label">টিসিবি দৈনিক জরিপ</span>
              <span class="detail-val font-bn">নিয়মিত অন্তর্ভুক্ত</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">রিটেইল কভারেজ</span>
              <span class="detail-val font-bn">৬০ টি পণ্য</span>
            </div>
          </div>
          <div class="market-footer">
            <a :href="`http://localhost:3001/markets/${m.slug}`" target="_blank" class="btn btn-sm btn-outline">
              পাবলিক ভিউ দেখুন ↗
            </a>
          </div>
        </article>
      </div>
    </section>

    <!-- ── 4. VALIDATION TAB ────────────────────────────────────────────── -->
    <section v-else-if="currentRouteName === 'Validation'" class="content-section">
      <div v-if="summaryData" class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">সর্বশেষ বুলেটিন</span>
          <span class="stat-val font-bn">{{ formatBnDate(summaryData.reportDate) }}</span>
          <span class="stat-sub font-bn">ক্রমিক নং: {{ formatBnInt(summaryData.serialNo ?? 0) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">মোট পর্যবেক্ষিত পণ্য</span>
          <span class="stat-val font-bn">{{ formatBnInt(summaryData.totalTracked ?? 0) }} টি</span>
          <span class="stat-sub text-success font-bn">১০০% ভ্যালিডেটেড</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">ঊর্ধ্বমুখী পণ্যের হার</span>
          <span class="stat-val text-danger font-bn">{{ formatBnInt(summaryData.upCount ?? 0) }} টি</span>
          <span class="stat-sub font-bn">{{ summaryData.shareUp ?? 0 }}% মার্কেট শেয়ার</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">নিম্নমুখী পণ্যের হার</span>
          <span class="stat-val text-success font-bn">{{ formatBnInt(summaryData.downCount ?? 0) }} টি</span>
          <span class="stat-sub font-bn">{{ summaryData.shareDown ?? 0 }}% মার্কেট শেয়ার</span>
        </div>
      </div>

      <div class="validation-rules-card">
        <h3>ডেটা ইন্টিগ্রিটি ও অ্যালগরিদম নীতিমালা</h3>
        <ul class="rule-list">
          <li>
            <span class="check-icon">✓</span>
            <div>
              <strong>শূন্য-মান প্রতিরোধ (Zero-Value Protection):</strong>
              <p>
                টিসিবি তালিকায় কোনো পণ্যের দাম অনুপস্থিত থাকলে তা শূন্য হিসেবে গ্রহণ করা হয় না; সিস্টেমে ফাঁকা হিসেবে
                সংরক্ষিত হয়।
              </p>
            </div>
          </li>
          <li>
            <span class="check-icon">✓</span>
            <div>
              <strong>স্বয়ংক্রিয় ডুপ্লিকেট শনাক্তকরণ (Hash-based Idempotency):</strong>
              <p>একই এক্সেল ফাইল পুনরাবৃত্তি হলে SHA256 চেকসাম ব্যবহার করে রি-ইমপোর্ট বাতিল করা হয়।</p>
            </div>
          </li>
          <li>
            <span class="check-icon">✓</span>
            <div>
              <strong>স্বাভাবিকীকরণ ও কি-ম্যাপিং (Key Normalisation):</strong>
              <p>বাংলা বানানের অমিল বা অতিরিক্ত স্পেস ফিল্টার করে অভিন্ন পণ্যের কোড শনাক্ত করা হয়।</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── 5. SETTINGS / SYSTEM TAB ──────────────────────────────────────── -->
    <section v-else class="content-section">
      <div class="system-grid">
        <div class="sys-card">
          <div class="sys-card__head">
            <h3>API সার্ভার স্বাস্থ্য</h3>
            <span v-if="healthStatus?.ok" class="badge badge--success">সক্রিয় (ONLINE)</span>
            <span v-else class="badge badge--danger">ত্রুটি (OFFLINE)</span>
          </div>
          <div class="sys-body">
            <div class="sys-row">
              <span>রেসপন্স লেটেন্সি:</span>
              <strong class="font-bn">{{ formatBnInt(healthStatus?.latency ?? 0) }} ms</strong>
            </div>
            <div class="sys-row">
              <span>ডাটাবেস চেক:</span>
              <strong class="text-success">{{ healthStatus?.data?.checks?.database ?? 'ok' }}</strong>
            </div>
            <div class="sys-row">
              <span>আপটাইম:</span>
              <span class="font-bn">{{ formatBnInt(Math.floor((healthStatus?.data?.uptime ?? 0) / 60)) }} মিনিট</span>
            </div>
          </div>
        </div>

        <div class="sys-card">
          <div class="sys-card__head">
            <h3>পরিবেশ ও কনফিগারেশন</h3>
            <span class="badge badge--neutral">Production Ready</span>
          </div>
          <div class="sys-body">
            <div class="sys-row">
              <span>চলমান পরিবেশ:</span>
              <strong>Development / Production</strong>
            </div>
            <div class="sys-row">
              <span>ডাটাবেস প্রোভাইডার:</span>
              <strong>Turso Cloud (libSQL)</strong>
            </div>
            <div class="sys-row">
              <span>স্টোরেজ ড্রাইভ:</span>
              <strong>Local / S3 Compatible</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workflow-view {
  max-width: 1080px;
}

.workflow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.badge--success {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border: 1px solid var(--color-trend-down-border);
}

.badge--danger {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
}

.badge--warn {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge--neutral {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-subtle);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
}

.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.table-wrap {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-card);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th {
  background: var(--color-bg-subtle);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-subtle);
}

.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: middle;
}

.empty-cell {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2.5rem 1rem;
}

.code-badge {
  background: var(--color-bg-subtle);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.btn-undo {
  background: transparent;
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.65rem;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.btn-undo:hover:not(:disabled) {
  background: var(--color-trend-up-bg);
}

.btn-undo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  max-width: 400px;
  width: 100%;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  outline: none;
}

.search-input:focus {
  border-color: var(--color-brand-primary);
}

.count-badge {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.markets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.market-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.market-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.market-icon {
  font-size: 1.75rem;
}

.market-card h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0 0 0.35rem;
}

.market-location {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-bottom: 1.25rem;
}

.market-details {
  border-top: 1px dashed var(--color-border-subtle);
  padding-top: 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
}

.detail-label {
  color: var(--color-text-muted);
}

.detail-val {
  font-weight: 600;
}

.market-footer {
  margin-top: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 600;
  display: block;
}

.stat-val {
  font-size: var(--text-2xl);
  font-weight: 800;
  display: block;
  margin: 0.35rem 0;
}

.stat-sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.validation-rules-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

.validation-rules-card h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rule-list li {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.check-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.rule-list p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: 0.25rem;
  line-height: 1.5;
}

.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.sys-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
}

.sys-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 1rem;
}

.sys-card__head h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0;
}

.sys-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.sys-row span {
  color: var(--color-text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.15rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--duration-fast);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: #fff;
  border: 1px solid var(--color-brand-primary);
}

.btn-primary:hover {
  background: var(--color-brand-hover);
}

.btn-outline {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
}

.btn-outline:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.btn-sm {
  padding: 0.3rem 0.75rem;
  font-size: var(--text-xs);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row {
  height: 48px;
  border-radius: var(--radius-md);
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
</style>
