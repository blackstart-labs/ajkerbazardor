<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { apiGet, apiPost, getApiTargetMode, setApiTargetMode, getApiBase, type ApiTargetMode } from '../api/client';
import { formatBnDate, formatBnInt, formatTaka } from '@ajkerbazardor/shared';

const route = useRoute();
const currentRouteName = computed(() => String(route.name ?? 'Settings'));

const apiTarget = ref<ApiTargetMode>(getApiTargetMode());
const currentBaseUrl = computed(() => getApiBase());

function changeTarget(mode: ApiTargetMode) {
  apiTarget.value = mode;
  setApiTargetMode(mode);
  loadRouteData();
}

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
    <header class="page-header">
      <div class="header-left">
        <span v-if="currentRouteName === 'Imports'" class="header-badge">📦 ডাটা ইনজেশন ও হিস্ট্রি</span>
        <span v-else-if="currentRouteName === 'PriceData'" class="header-badge">📊 রেট ট্র্যাকিং ও পর্যবেক্ষণ</span>
        <span v-else-if="currentRouteName === 'Markets'" class="header-badge">🏪 কাঁচাবাজার নেটওয়ার্ক</span>
        <span v-else-if="currentRouteName === 'Validation'" class="header-badge">✅ কোয়ালিটি ও অ্যালগরিদম পলিসি</span>
        <span v-else class="header-badge">⚙️ সিস্টেম ডায়াগনস্টিক ও স্ট্যাটাস</span>

        <h1 v-if="currentRouteName === 'Imports'" class="page-title">আপলোড ইতিহাস ও রিভিশন</h1>
        <h1 v-else-if="currentRouteName === 'PriceData'" class="page-title">বাজারদর পর্যবেক্ষণ ও তথ্য</h1>
        <h1 v-else-if="currentRouteName === 'Markets'" class="page-title">মনিটরিংকৃত বাজার ব্যবস্থাপনা</h1>
        <h1 v-else-if="currentRouteName === 'Validation'" class="page-title">ডেটা কোয়ালিটি ও ভ্যালিডেশন ড্যাশবোর্ড</h1>
        <h1 v-else class="page-title">সিস্টেম স্ট্যাটাস ও কনফিগারেশন</h1>

        <p class="page-subtitle">দৈনিক বুলেটিন সমন্বয়, ডাটাবেস রেকর্ড ব্যবস্থাপনা ও সিস্টেম হেলথ পর্যবেক্ষণ প্যানেল</p>
      </div>

      <div class="header-actions">
        <RouterLink v-if="currentRouteName === 'Imports'" to="/upload" class="btn btn--coral">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          নতুন এক্সেল আপলোড
        </RouterLink>
        <button
          v-else-if="currentRouteName === 'Settings'"
          type="button"
          class="btn btn--refresh"
          :disabled="checkingHealth"
          @click="checkHealth"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {{ checkingHealth ? 'যাচাই হচ্ছে…' : 'হেলথ রিফ্রেশ' }}
        </button>
      </div>
    </header>

    <!-- Error Alert -->
    <div v-if="error" class="alert-box alert-box--error" role="alert">
      {{ error }}
    </div>

    <!-- ── 1. IMPORTS TAB ───────────────────────────────────────────────── -->
    <section v-if="currentRouteName === 'Imports'" class="content-section">
      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 6" :key="n" class="skeleton-shimmer" />
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
            <tr v-for="imp in imports" :key="imp.id" class="table-row">
              <td class="font-bn font-bold text-base">{{ formatBnDate(imp.date) }}</td>
              <td class="text-secondary font-semibold">{{ imp.fileName }}</td>
              <td>
                <span class="code-badge font-mono">{{ imp.sha256 }}</span>
              </td>
              <td class="font-bn font-bold text-base">{{ formatBnInt(imp.productCount) }} টি</td>
              <td class="font-bn">
                <span :class="imp.newProducts > 0 ? 'badge badge--warn' : 'badge badge--neutral'">
                  {{ formatBnInt(imp.newProducts) }} টি
                </span>
              </td>
              <td class="text-muted text-sm font-bn">
                {{ imp.createdAt ? new Date(imp.createdAt.replace(' ', 'T')).toLocaleString('bn-BD') : '—' }}
              </td>
              <td>
                <button type="button" class="btn-undo" :disabled="undoingId === imp.id" @click="undoRevision(imp.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  {{ undoingId === imp.id ? 'বাতিল হচ্ছে…' : 'বাতিল (Undo)' }}
                </button>
              </td>
            </tr>
            <tr v-if="imports.length === 0">
              <td colspan="7" class="empty-state-cell">
                <div class="empty-content">
                  <span class="empty-icon">📁</span>
                  <p class="empty-title">কোনো আপলোড ইতিহাস পাওয়া যায়নি</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── 2. PRICE DATA TAB ────────────────────────────────────────────── -->
    <section v-else-if="currentRouteName === 'PriceData'" class="content-section">
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
            v-model="priceSearch"
            type="search"
            placeholder="পণ্য বা ক্যাটাগরির নাম লিখে খুঁজুন…"
            class="search-input"
          />
        </div>
        <span class="count-pill font-bn">মোট {{ formatBnInt(filteredPrices.length) }} টি পণ্য</span>
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 6" :key="n" class="skeleton-shimmer" />
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
            <tr v-for="item in filteredPrices" :key="item.id" class="table-row">
              <td>
                <div class="product-cell">
                  <span class="product-name font-bold">{{ item.nameBn }}</span>
                  <span class="product-slug font-mono">{{ item.slug }}</span>
                </div>
              </td>
              <td>
                <span class="category-tag">{{ item.categoryNameBn ?? 'সাধারণ' }}</span>
              </td>
              <td class="font-bn text-sm">{{ item.unitLabelBn ?? item.unitLabel ?? '—' }}</td>
              <td class="font-bn font-bold text-base">
                {{ item.minPrice !== null && item.minPrice !== undefined ? formatTaka(item.minPrice) : '—' }}
              </td>
              <td class="font-bn font-bold text-base">
                {{ item.maxPrice !== null && item.maxPrice !== undefined ? formatTaka(item.maxPrice) : '—' }}
              </td>
              <td>
                <span :class="item.archivedAt ? 'badge badge--danger' : 'badge badge--success'">
                  {{ item.archivedAt ? 'আর্কাইভকৃত' : 'সক্রিয়' }}
                </span>
              </td>
              <td>
                <RouterLink :to="`/products/${item.id}`" class="row-edit-btn"> সম্পাদনা ✎ </RouterLink>
              </td>
            </tr>
            <tr v-if="filteredPrices.length === 0">
              <td colspan="7" class="empty-state-cell">
                <div class="empty-content">
                  <span class="empty-icon">🔍</span>
                  <p class="empty-title">কোনো পণ্য পাওয়া যায়নি</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── 3. MARKETS TAB ───────────────────────────────────────────────── -->
    <section v-else-if="currentRouteName === 'Markets'" class="content-section">
      <div class="markets-grid">
        <article v-for="m in marketsList" :key="m.id" class="market-card">
          <div class="market-card__head">
            <div class="market-icon-wrap">
              <span class="market-icon">🏪</span>
            </div>
            <span class="badge badge--success">সক্রিয় মনিটরিং</span>
          </div>

          <h3 class="market-name">{{ m.nameBn }}</h3>
          <p class="market-area">📍 {{ m.area }}</p>

          <div class="market-details">
            <div class="detail-row">
              <span class="detail-label">টিসিবি দৈনিক জরিপ</span>
              <span class="detail-val font-bn text-success font-bold">নিয়মিত অন্তর্ভুক্ত</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">রিটেইল কভারেজ</span>
              <span class="detail-val font-bn font-bold">৬০ টি নিত্যপণ্য</span>
            </div>
          </div>

          <div class="market-card__footer">
            <a :href="`http://localhost:3001/markets/${m.slug}`" target="_blank" class="market-link-btn">
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
          <span class="stat-sub text-success font-bn font-bold">১০০% ভ্যালিডেটেড</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">ঊর্ধ্বমুখী পণ্যের হার</span>
          <span class="stat-val text-coral font-bn">{{ formatBnInt(summaryData.upCount ?? 0) }} টি</span>
          <span class="stat-sub font-bn">{{ summaryData.shareUp ?? 0 }}% মার্কেট শেয়ার</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">নিম্নমুখী পণ্যের হার</span>
          <span class="stat-val text-success font-bn">{{ formatBnInt(summaryData.downCount ?? 0) }} টি</span>
          <span class="stat-sub font-bn">{{ summaryData.shareDown ?? 0 }}% মার্কেট শেয়ার</span>
        </div>
      </div>

      <div class="validation-rules-card">
        <div class="rules-header">
          <span class="rules-badge">🛡️ এলগরিদম পলিসি ও রুলস</span>
          <h3 class="rules-title">ডেটা ইন্টিগ্রিটি ও স্বয়ংক্রিয় সুরক্ষা নীতিমালা</h3>
        </div>

        <ul class="rule-list">
          <li class="rule-item">
            <div class="check-icon">✓</div>
            <div class="rule-body">
              <strong>শূন্য-মান প্রতিরোধ (Zero-Value Protection):</strong>
              <p>
                টিসিবি তালিকায় কোনো পণ্যের দাম অনুপস্থিত বা অসম্পূর্ণ থাকলে তা শূন্য হিসেবে ডাটাবেসে গ্রহণ করা হয় না;
                সিস্টেমে ফাঁকা (null) হিসেবে সংরক্ষিত হয় যাতে গড়ের মান বিভ্রান্ত না হয়।
              </p>
            </div>
          </li>
          <li class="rule-item">
            <div class="check-icon">✓</div>
            <div class="rule-body">
              <strong>স্বয়ংক্রিয় ডুপ্লিকেট শনাক্তকরণ (Hash-based Idempotency):</strong>
              <p>
                একই এক্সেল ফাইল পুনরায় আপলোড করার চেষ্টা করা হলে ক্রিপ্টোগ্রাফিক SHA256 চেকসাম ব্যবহার করে তাৎক্ষণিক
                শনাক্ত করা হয় এবং ডুপ্লিকেট ইনজেশন বাতিল করা হয়।
              </p>
            </div>
          </li>
          <li class="rule-item">
            <div class="check-icon">✓</div>
            <div class="rule-body">
              <strong>স্বাভাবিকীকরণ ও কি-ম্যাপিং (Key Normalisation):</strong>
              <p>
                বাংলা বানানের অমিল, যতিচিহ্ন বা অপ্রয়োজনীয় স্পেস ফিল্টার করে স্বয়ংক্রিয়ভাবে অভিন্ন পণ্যের ক্যাটালগ
                কোড শনাক্ত করা হয়।
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── 5. SETTINGS / SYSTEM TAB ──────────────────────────────────────── -->
    <section v-else class="content-section">
      <div class="system-grid">
        <!-- Target Switcher Card -->
        <div class="sys-card sys-card--highlight">
          <div class="sys-card__head">
            <div class="sys-title-wrap">
              <span class="sys-icon">🔀</span>
              <h3 class="sys-title">API টার্গেট কন্ট্রোল (Local / Live)</h3>
            </div>
            <span class="badge" :class="apiTarget === 'local' ? 'badge--success' : 'badge--neutral'">
              {{ apiTarget === 'local' ? 'লোকাল মোড' : 'লাইভ ক্লাউড' }}
            </span>
          </div>
          <div class="sys-body">
            <div class="target-switch-container">
              <button
                type="button"
                class="switch-pill-btn"
                :class="{ 'switch-pill-btn--active': apiTarget === 'local' }"
                @click="changeTarget('local')"
              >
                💻 লোকাল (localhost:3000)
              </button>
              <button
                type="button"
                class="switch-pill-btn"
                :class="{ 'switch-pill-btn--active': apiTarget === 'live' }"
                @click="changeTarget('live')"
              >
                🌐 লাইভ (Vercel Cloud)
              </button>
            </div>
            <div class="sys-row">
              <span class="sys-label">বর্তমান সক্রিয় URL:</span>
              <code class="font-mono text-coral font-bold">{{ currentBaseUrl }}</code>
            </div>
            <div class="sys-row">
              <span class="sys-label">কন্ট্রোল স্ট্যাটাস:</span>
              <span class="text-success font-bold font-bn">সুইচার সক্রিয় ও কার্যকরী</span>
            </div>
          </div>
        </div>

        <div class="sys-card">
          <div class="sys-card__head">
            <div class="sys-title-wrap">
              <span class="sys-icon">⚡</span>
              <h3 class="sys-title">API সার্ভার ও ডাটাবেস হেলথ</h3>
            </div>
            <span v-if="healthStatus?.ok" class="badge badge--success">সক্রিয় (ONLINE)</span>
            <span v-else class="badge badge--danger">ত্রুটি (OFFLINE)</span>
          </div>
          <div class="sys-body">
            <div class="sys-row">
              <span class="sys-label">রেসপন্স লেটেন্সি:</span>
              <strong class="font-bn font-bold text-base">{{ formatBnInt(healthStatus?.latency ?? 0) }} ms</strong>
            </div>
            <div class="sys-row">
              <span class="sys-label">ডাটাবেস চেক:</span>
              <strong class="text-success font-bold">{{ healthStatus?.data?.checks?.database ?? 'সচল (ok)' }}</strong>
            </div>
            <div class="sys-row">
              <span class="sys-label">আপটাইম:</span>
              <span class="font-bn font-bold"
                >{{ formatBnInt(Math.floor((healthStatus?.data?.uptime ?? 0) / 60)) }} মিনিট</span
              >
            </div>
          </div>
        </div>

        <div class="sys-card">
          <div class="sys-card__head">
            <div class="sys-title-wrap">
              <span class="sys-icon">🌐</span>
              <h3 class="sys-title">পরিবেশ ও অবকাঠামো কনফিগারেশন</h3>
            </div>
            <span class="badge badge--neutral">Production Ready</span>
          </div>
          <div class="sys-body">
            <div class="sys-row">
              <span class="sys-label">চলমান ক্লাউড পরিবেশ:</span>
              <strong class="font-mono">Vercel Serverless (iad1)</strong>
            </div>
            <div class="sys-row">
              <span class="sys-label">ডাটাবেস কানেকশন:</span>
              <strong class="font-bold">Turso Cloud (libSQL)</strong>
            </div>
            <div class="sys-row">
              <span class="sys-label">লোকাল ক্যাশ ও স্পার্কলাইন:</span>
              <strong class="text-success font-bold">ইন-মেমোরি ফাস্ট রিড্রিভাল</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workflow-view {
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

/* Alerts */
.alert-box {
  padding: 1rem 1.25rem;
  border-radius: var(--card-radius-sm);
  margin-bottom: 1.5rem;
  font-size: var(--text-sm);
}

.alert-box--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
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

.table-row {
  transition: background-color 0.15s ease;
}

.table-row:hover td {
  background-color: #faf6f0;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Cells */
.text-base {
  font-size: var(--text-base) !important;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.code-badge {
  background: var(--color-bg-subtle);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.product-name {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.product-slug {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.category-tag {
  display: inline-block;
  font-size: var(--text-xs);
  background: var(--color-bg-canvas);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
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

.badge--danger {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
}

.badge--warn {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge--neutral {
  background: var(--color-bg-canvas);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-subtle);
}

.btn-undo {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
  border-radius: 9999px;
  padding: 0.4rem 0.85rem;
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-undo:hover:not(:disabled) {
  background: var(--color-coral-primary);
  color: #fff;
}

.btn-undo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.row-edit-btn {
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

.row-edit-btn:hover {
  background: var(--color-coral-primary);
  color: #fff;
}

/* ── Markets Grid ─────────────────────────────────────────────────────────── */
.markets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.market-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  padding: 1.75rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.market-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.market-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.market-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--color-coral-subtle);
  border: 1px solid var(--color-coral-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.market-icon {
  font-size: 1.5rem;
}

.market-name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 0.35rem;
}

.market-area {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-bottom: 1.25rem;
}

.market-details {
  background: var(--color-bg-canvas);
  border-radius: var(--card-radius-sm);
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
}

.detail-label {
  color: var(--color-text-muted);
}

.market-card__footer {
  margin-top: auto;
}

.market-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-strong);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.market-link-btn:hover {
  border-color: var(--color-coral-primary);
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
}

/* ── Validation Tab ──────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  padding: 1.5rem 1.75rem;
  box-shadow: var(--card-shadow);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 600;
  display: block;
}

.stat-val {
  font-size: 1.75rem;
  font-weight: 800;
  display: block;
  margin: 0.35rem 0;
  color: var(--color-text-primary);
}

.stat-sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.text-coral {
  color: var(--color-coral-primary);
}

.text-success {
  color: var(--color-trend-down);
}

.validation-rules-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  padding: 2.25rem;
  box-shadow: var(--card-shadow);
}

.rules-header {
  margin-bottom: 1.75rem;
}

.rules-badge {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-accent-green);
  background: var(--color-accent-green-subtle);
  border: 1px solid #a7f3d0;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
}

.rules-title {
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text-primary);
}

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rule-item {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.check-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
}

.rule-body strong {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.rule-body p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: 0.35rem;
  line-height: 1.6;
}

/* ── Settings / System Tab ───────────────────────────────────────────────── */
.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}

.sys-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.sys-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 1.25rem;
}

.sys-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.sys-icon {
  font-size: 1.35rem;
}

.sys-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.sys-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.sys-label {
  color: var(--color-text-muted);
}

.sys-card--highlight {
  border-color: var(--color-coral-border);
  box-shadow: 0 6px 24px rgba(255, 107, 74, 0.08);
}

.target-switch-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: var(--color-bg-canvas);
  padding: 4px;
  border-radius: 9999px;
  border: 1px solid var(--color-border-strong);
  margin-bottom: 0.5rem;
}

.switch-pill-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.switch-pill-btn:hover {
  color: var(--color-text-primary);
}

.switch-pill-btn--active {
  background: var(--color-coral-gradient) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(244, 68, 46, 0.28);
}

/* Skeletons */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-shimmer {
  height: 52px;
  border-radius: var(--card-radius-sm);
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
</style>
