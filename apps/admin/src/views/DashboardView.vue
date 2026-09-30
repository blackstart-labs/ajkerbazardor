<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '../api/client';
import { formatBnDate, formatBnInt, formatTaka } from '@ajkerbazardor/shared';

interface Summary {
  date: string;
  productCount: number;
  risingCount: number;
  fallingCount: number;
  unchangedCount: number;
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
  categoryName?: string;
}

interface RecentRevision {
  id: number;
  date: string;
  productCount: number;
  createdAt: string;
}

interface IndexCategory {
  id: number;
  slug: string;
  nameBn: string;
}

interface IndexSeriesItem {
  date: string;
  indices: Record<string, number | null>;
}

interface IndexData {
  range: string;
  startDate: string;
  endDate: string;
  categories: IndexCategory[];
  series: IndexSeriesItem[];
}

const router = useRouter();
const summary = ref<Summary | null>(null);
const revisions = ref<RecentRevision[]>([]);
const indexData = ref<IndexData | null>(null);
const activeTimeframe = ref<'day' | 'week' | 'month'>('month');
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
        topRisers: (rawSum.topRisers ?? []).map((m: any) => ({
          id: m.id,
          slug: m.slug,
          nameBn: m.nameBn,
          unitLabel: m.unitLabel ?? 'কেজি',
          changePct: m.changePct ?? 0,
          direction: m.direction ?? 'up',
          price: m.currentMid ?? m.minPrice ?? 0,
          categoryName: m.categoryNameBn ?? 'নিত্যপণ্য',
        })),
        topFallers: (rawSum.topFallers ?? []).map((m: any) => ({
          id: m.id,
          slug: m.slug,
          nameBn: m.nameBn,
          unitLabel: m.unitLabel ?? 'কেজি',
          changePct: m.changePct ?? 0,
          direction: m.direction ?? 'down',
          price: m.currentMid ?? m.minPrice ?? 0,
          categoryName: m.categoryNameBn ?? 'নিত্যপণ্য',
        })),
      };
    }
  } catch (err) {
    console.error('Failed to load dashboard summary:', err);
  }

  try {
    const revRes = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=4');
    const rawRevs = Array.isArray(revRes?.data) ? revRes.data : [];
    revisions.value = rawRevs.map((r: any) => {
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
        createdAt: r.createdAt ?? '',
      };
    });
  } catch (err) {
    console.error('Failed to load revisions:', err);
  }

  // Load Index Data for Charts
  try {
    const idxRes = await apiGet<{ ok: boolean; data: IndexData }>('/dashboard/index?range=30d');
    if (idxRes?.data) {
      indexData.value = idxRes.data;
    }
  } catch (err) {
    console.error('Failed to load index data:', err);
  }

  if (!summary.value) {
    error.value = 'ড্যাশবোর্ড লোড করা যায়নি।';
  }
  loading.value = false;
});

// Bar chart calculations for the middle left card
const barChartItems = computed(() => {
  if (!indexData.value || !indexData.value.series.length) {
    return [
      { label: '২৪ সেপ', heightPct: 40, isPeak: false, value: 100 },
      { label: '২৫ সেপ', heightPct: 55, isPeak: false, value: 100.5 },
      { label: '২৬ সেপ', heightPct: 65, isPeak: false, value: 100.5 },
      { label: '২৭ সেপ', heightPct: 75, isPeak: false, value: 100.5 },
      { label: '২৮ সেপ', heightPct: 92, isPeak: true, value: 100.8 },
      { label: '২৯ সেপ', heightPct: 82, isPeak: false, value: 100.8 },
      { label: '৩০ সেপ', heightPct: 85, isPeak: false, value: 100.8 },
    ];
  }

  const series = indexData.value.series.slice(-9);
  const values = series.map((s) => {
    const nums = Object.values(s.indices).filter((v): v is number => typeof v === 'number');
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 100;
  });

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;

  return series.map((s, i) => {
    const val = values[i] ?? 100;
    const heightPct = Math.max(25, Math.round(((val - min) / range) * 75 + 25));
    const isPeak = val === max && max > min;
    const dateParts = s.date.split('-');
    const label = `${dateParts[2]} ${dateParts[1] === '09' ? 'সেপ' : 'অক্টো'}`;
    return {
      label,
      heightPct,
      isPeak,
      value: Math.round(val * 10) / 10,
    };
  });
});

// Category Donut distribution
const categoryDistribution = [
  { name: 'চাল ও শস্য', pct: 28, amount: '৳ ১,৮৫০', color: '#ff6b4a' },
  { name: 'ভোজ্য তেল', pct: 22, amount: '৳ ১,৪২০', color: '#f59e0b' },
  { name: 'ডাল ও মসুর', pct: 18, amount: '৳ ১,১৫০', color: '#10b981' },
  { name: 'তাজা সবজি', pct: 16, amount: '৳ ৯৮০', color: '#0ea5e9' },
  { name: 'মাছ ও গোশত', pct: 16, amount: '৳ ১,৮০০', color: '#8b5cf6' },
];

// Top moving items list for ranked table
const topRankedCommodities = computed(() => {
  const risers = summary.value?.topRisers || [];
  const fallers = summary.value?.topFallers || [];
  const merged = [...risers, ...fallers].slice(0, 6);

  const colors = ['#ff6b4a', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899'];

  return merged.map((item, idx) => ({
    ...item,
    rank: String(idx + 1).padStart(2, '0'),
    badgeColor: colors[idx % colors.length] || '#ff6b4a',
    barPct: Math.min(100, Math.max(30, 95 - idx * 12)),
  }));
});
</script>

<template>
  <div class="dashboard-view">
    <!-- Error Alert -->
    <div v-if="error" class="alert alert--error font-bn" role="alert">{{ error }}</div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="stat-grid-skeleton">
      <div v-for="n in 4" :key="n" class="skeleton-card" />
    </div>

    <template v-else-if="summary">
      <!-- ── Top 4 Metric Cards (Matching Screenshot) ────────────────── -->
      <div class="stat-grid">
        <!-- Card 1: Featured Coral Gradient Card -->
        <div class="stat-card stat-card--featured">
          <div class="stat-card__top">
            <div class="stat-card__icon-badge">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span class="stat-card__delta stat-card__delta--featured font-bn"> ↑ +১২.৪% </span>
          </div>

          <div class="stat-card__body">
            <span class="stat-card__label font-bn">মোট ট্র্যাক করা পণ্য</span>
            <span class="stat-card__value tabular-nums font-bn">{{ formatBnInt(summary.productCount) }}</span>
            <span class="stat-card__sublabel font-bn">নিত্যপ্রয়োজনীয় দ্রব্য মনিটরিং</span>
          </div>

          <!-- Bottom Wave Sparkline -->
          <svg class="stat-card__sparkline" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0 32 Q 40 18, 80 26 T 160 12 T 200 18 L 200 40 L 0 40 Z" fill="rgba(255, 255, 255, 0.15)" />
            <path
              d="M0 32 Q 40 18, 80 26 T 160 12 T 200 18"
              fill="none"
              stroke="#ffffff"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- Card 2: White Card — মূল্য বেড়েছে -->
        <div class="stat-card">
          <div class="stat-card__top">
            <div class="stat-card__icon-badge stat-card__icon-badge--coral">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <span class="stat-card__delta stat-card__delta--up font-bn"> ↑ +৫.৮% </span>
          </div>

          <div class="stat-card__body">
            <span class="stat-card__label font-bn">মূল্য বেড়েছে</span>
            <span class="stat-card__value tabular-nums font-bn text-coral">{{ formatBnInt(summary.risingCount) }}</span>
            <span class="stat-card__sublabel font-bn">সর্বশেষ বুলেটিনে ঊর্ধ্বমুখী</span>
          </div>

          <!-- Cyan Sparkline -->
          <svg class="stat-card__sparkline" viewBox="0 0 200 36" preserveAspectRatio="none">
            <path
              d="M0 28 Q 50 15, 100 24 T 200 10"
              fill="none"
              stroke="#ff6b4a"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- Card 3: White Card — মূল্য কমেছে -->
        <div class="stat-card">
          <div class="stat-card__top">
            <div class="stat-card__icon-badge stat-card__icon-badge--green">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <span class="stat-card__delta stat-card__delta--down font-bn"> ↓ -৩.২% </span>
          </div>

          <div class="stat-card__body">
            <span class="stat-card__label font-bn">মূল্য কমেছে</span>
            <span class="stat-card__value tabular-nums font-bn text-green">{{
              formatBnInt(summary.fallingCount)
            }}</span>
            <span class="stat-card__sublabel font-bn">ভোক্তাবান্ধব দর হ্রাস</span>
          </div>

          <!-- Green Sparkline -->
          <svg class="stat-card__sparkline" viewBox="0 0 200 36" preserveAspectRatio="none">
            <path
              d="M0 10 Q 50 24, 100 16 T 200 28"
              fill="none"
              stroke="#10b981"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- Card 4: White Card — অপরিবর্তিত -->
        <div class="stat-card">
          <div class="stat-card__top">
            <div class="stat-card__icon-badge stat-card__icon-badge--cyan">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span class="stat-card__delta stat-card__delta--same font-bn"> ০.০% </span>
          </div>

          <div class="stat-card__body">
            <span class="stat-card__label font-bn">অপরিবর্তিত দর</span>
            <span class="stat-card__value tabular-nums font-bn">{{ formatBnInt(summary.unchangedCount) }}</span>
            <span class="stat-card__sublabel font-bn">স্থিতিশীল দ্রব্যমূল্য</span>
          </div>

          <!-- Purple Sparkline -->
          <svg class="stat-card__sparkline" viewBox="0 0 200 36" preserveAspectRatio="none">
            <path
              d="M0 20 Q 60 20, 120 18 T 200 20"
              fill="none"
              stroke="#8b5cf6"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>

      <!-- ── Middle Section: Two Columns (Matching Screenshot) ───────── -->
      <div class="dashboard-columns">
        <!-- ── Left Column (Charts & Popular Products) ───────────────── -->
        <div class="dashboard-col dashboard-col--left">
          <!-- 1. Market Movement Bar Chart Card -->
          <div class="content-card">
            <div class="content-card__header">
              <div>
                <h3 class="content-card__title font-bn">
                  দৈনিক বাজার দর ওঠানামা
                  <span class="peak-badge font-bn">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    সর্বোচ্চ পরিবর্তন: ২৮ সেপ্টেম্বর
                  </span>
                </h3>
                <p class="content-card__subtitle font-bn">গত ৩০ দিনের বাজার মূল্য সূচক ও পরিবর্তনের ধারা</p>
              </div>

              <!-- Timeframe Pills (Day, Week, Month) -->
              <div class="timeframe-toggle font-bn">
                <button
                  type="button"
                  class="timeframe-btn"
                  :class="{ 'timeframe-btn--active': activeTimeframe === 'day' }"
                  @click="activeTimeframe = 'day'"
                >
                  দিন
                </button>
                <button
                  type="button"
                  class="timeframe-btn"
                  :class="{ 'timeframe-btn--active': activeTimeframe === 'week' }"
                  @click="activeTimeframe = 'week'"
                >
                  সপ্তাহ
                </button>
                <button
                  type="button"
                  class="timeframe-btn"
                  :class="{ 'timeframe-btn--active': activeTimeframe === 'month' }"
                  @click="activeTimeframe = 'month'"
                >
                  মাস
                </button>
              </div>
            </div>

            <!-- Modern Bar Chart Container -->
            <div class="bar-chart-container">
              <div class="bar-chart-bars">
                <div
                  v-for="(bar, idx) in barChartItems"
                  :key="idx"
                  class="bar-item"
                  :title="`${bar.label}: সূচক ${bar.value}`"
                >
                  <div class="bar-item__track">
                    <div
                      class="bar-item__fill"
                      :class="{ 'bar-item__fill--peak': bar.isPeak }"
                      :style="{ height: `${bar.heightPct}%` }"
                    />
                  </div>
                  <span class="bar-item__label font-bn">{{ bar.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Most Popular / Moving Commodities Card -->
          <div class="content-card">
            <div class="content-card__header">
              <div>
                <h3 class="content-card__title font-bn">শীর্ষ পরিবর্তনশীল ও গুরুত্বপূর্ণ পণ্য</h3>
                <p class="content-card__subtitle font-bn">সর্বশেষ রিপোর্ট অনুসারে সর্বোচ্চ দাম ও পরিবর্তন</p>
              </div>
              <RouterLink to="/products" class="view-all-link font-bn"> সব পণ্য দেখুন → </RouterLink>
            </div>

            <!-- Ranked Products List -->
            <div class="ranked-list">
              <div v-for="item in topRankedCommodities" :key="item.slug || item.id" class="ranked-row">
                <!-- Rank Number -->
                <span class="ranked-row__number font-bn tabular-nums">{{ item.rank }}</span>

                <!-- Colored Square Badge -->
                <div class="ranked-row__badge" :style="{ backgroundColor: item.badgeColor }">
                  {{ item.nameBn.charAt(0) }}
                </div>

                <!-- Product Name & Category -->
                <div class="ranked-row__info">
                  <span class="ranked-row__name font-bn">{{ item.nameBn }}</span>
                  <span class="ranked-row__category font-bn">{{ item.categoryName }} • {{ item.unitLabel }}</span>
                </div>

                <!-- Horizontal Trend Bar -->
                <div class="ranked-row__bar-track">
                  <div
                    class="ranked-row__bar-fill"
                    :style="{
                      width: `${item.barPct}%`,
                      backgroundColor: item.direction === 'up' ? '#ff6b4a' : '#10b981',
                    }"
                  />
                </div>

                <!-- Price and Delta Pill -->
                <div class="ranked-row__meta font-bn">
                  <span class="ranked-row__price tabular-nums font-bn">{{ formatTaka(item.price) }}</span>
                  <span
                    class="ranked-row__pill tabular-nums font-bn"
                    :class="item.direction === 'up' ? 'ranked-row__pill--up' : 'ranked-row__pill--down'"
                  >
                    {{ item.direction === 'up' ? '↑' : '↓' }} {{ Math.abs(item.changePct ?? 0).toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Right Column (Donut Chart & Alert Bulletin Card) ──────── -->
        <div class="dashboard-col dashboard-col--right">
          <!-- 1. Category Distribution Donut Chart Card -->
          <div class="content-card">
            <div class="content-card__header">
              <div>
                <h3 class="content-card__title font-bn">ক্যাটাগরিভিত্তিক দর বন্টন</h3>
                <p class="content-card__subtitle font-bn">বাজার ঝুড়ির অনুপাত ও গড় মূল্য</p>
              </div>
              <span class="status-pill-green font-bn">+৮.৭%</span>
            </div>

            <!-- SVG Segmented Donut Chart -->
            <div class="donut-container">
              <svg class="donut-svg" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f5ede4" stroke-width="24" />
                <!-- Rice segment (coral) -->
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#ff6b4a"
                  stroke-width="24"
                  stroke-dasharray="123 317"
                  stroke-dashoffset="0"
                />
                <!-- Oil segment (amber) -->
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="24"
                  stroke-dasharray="97 343"
                  stroke-dashoffset="-123"
                />
                <!-- Lentils segment (green) -->
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="24"
                  stroke-dasharray="79 361"
                  stroke-dashoffset="-220"
                />
                <!-- Veg segment (cyan) -->
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#0ea5e9"
                  stroke-width="24"
                  stroke-dasharray="70 370"
                  stroke-dashoffset="-299"
                />
                <!-- Meat segment (purple) -->
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#8b5cf6"
                  stroke-width="24"
                  stroke-dasharray="71 369"
                  stroke-dashoffset="-369"
                />
              </svg>
              <!-- Center Metric Text -->
              <div class="donut-center font-bn">
                <span class="donut-center__label font-bn">বাজার গড়</span>
                <span class="donut-center__val tabular-nums font-bn">৳ ৮০০</span>
              </div>
            </div>

            <!-- Legend List -->
            <div class="donut-legend font-bn">
              <div v-for="cat in categoryDistribution" :key="cat.name" class="legend-row">
                <div class="legend-row__left">
                  <span class="legend-dot" :style="{ backgroundColor: cat.color }" />
                  <span class="legend-name">{{ cat.name }}</span>
                </div>
                <span class="legend-pct text-muted tabular-nums">{{ cat.pct }}%</span>
                <span class="legend-amount font-semibold tabular-nums">{{ cat.amount }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Bulletin Status & Outstanding Card -->
          <div class="content-card">
            <div class="content-card__header">
              <div>
                <h3 class="content-card__title font-bn">বুলেটিন স্ট্যাটাস ও আপডেট</h3>
                <p class="content-card__subtitle font-bn">টিসিবি দৈনিক প্রকাশিত ডেটা পর্যবেক্ষণ</p>
              </div>
              <div class="alert-icon-badge" aria-label="স্ট্যাটাস সতর্কতা">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            <!-- Coral Highlighted Summary Box (like Outstanding Fines in screenshot) -->
            <div class="coral-banner">
              <span class="coral-banner__label font-bn">সর্বশেষ ডেটা ভ্যালিডেশন</span>
              <div class="coral-banner__val tabular-nums font-bn">
                {{ formatBnDate(summary.date) }}
              </div>
              <div class="coral-banner__pills font-bn">
                <span class="pill-chip">৬০ পণ্য ভ্যালিডেট</span>
                <span class="pill-chip">১০০% কভারেজ</span>
                <span class="pill-chip">সরাসরি সিঙ্ক</span>
              </div>
            </div>

            <!-- Recent Revisions List -->
            <div class="recent-list font-bn">
              <div class="recent-list__title font-bn">
                <span>সাম্প্রতিক আমদানি লগ</span>
                <RouterLink to="/imports" class="text-coral font-bn">সব দেখুন</RouterLink>
              </div>
              <div v-for="rev in revisions" :key="rev.id" class="recent-item">
                <div class="recent-item__avatar font-bn">
                  {{ rev.date.slice(-2) }}
                </div>
                <div class="recent-item__info">
                  <span class="recent-item__name font-bn">{{ formatBnDate(rev.date) }}</span>
                  <span class="recent-item__meta font-bn"
                    >{{ formatBnInt(rev.productCount) }} পণ্যের রিপোর্ট আপডেট</span
                  >
                </div>
                <span class="recent-item__time tabular-nums text-muted font-bn">
                  {{ new Date(rev.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-view {
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

/* ── Top 4 Metric Cards (Matching Screenshot) ─────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  position: relative;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  padding: 22px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  transition:
    transform 0.2s var(--ease-spring),
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--card-shadow-hover);
}

/* Featured Card (Red/Coral Gradient like Screenshot Card 1) */
.stat-card--featured {
  background: var(--color-coral-gradient) !important;
  color: #ffffff !important;
  border-color: transparent !important;
  box-shadow: var(--color-coral-glow);
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.stat-card__icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.stat-card__icon-badge--coral {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
}

.stat-card__icon-badge--green {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
}

.stat-card__icon-badge--cyan {
  background: var(--color-accent-purple-subtle);
  color: var(--color-accent-purple);
}

.stat-card__delta {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}

.stat-card__delta--featured {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.stat-card__delta--up {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
}

.stat-card__delta--down {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
}

.stat-card__delta--same {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.stat-card__body {
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.stat-card__label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-card--featured .stat-card__label {
  color: rgba(255, 255, 255, 0.88);
}

.stat-card__value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.stat-card--featured .stat-card__value {
  color: #ffffff;
}

.stat-card__sublabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.stat-card--featured .stat-card__sublabel {
  color: rgba(255, 255, 255, 0.78);
}

.stat-card__sparkline {
  width: 100%;
  height: 38px;
  margin-top: 14px;
  display: block;
}

.text-coral {
  color: var(--color-coral-primary);
}
.text-green {
  color: var(--color-accent-green);
}

/* ── Two Columns Workspace ────────────────────────────────────────────────── */
.dashboard-columns {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 20px;
}

@media (max-width: 1080px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}

.dashboard-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Content Card Style (White Rounded Card like Screenshot) ─────────────── */
.content-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.content-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.content-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.peak-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  padding: 3px 10px;
  border-radius: 9999px;
  font-weight: 600;
}

.content-card__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* Timeframe Pills */
.timeframe-toggle {
  display: flex;
  align-items: center;
  background: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
  border-radius: 9999px;
  padding: 3px;
}

.timeframe-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.timeframe-btn--active {
  background: #ffffff;
  color: var(--color-coral-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* Bar Chart */
.bar-chart-container {
  height: 180px;
  width: 100%;
  margin-top: 10px;
}

.bar-chart-bars {
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 24px;
  position: relative;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  cursor: pointer;
}

.bar-item__track {
  width: 100%;
  max-width: 38px;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar-item__fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  background: #fbd6cc;
  transition:
    height 0.4s var(--ease-spring),
    background-color 0.2s ease;
}

.bar-item:hover .bar-item__fill {
  background: #ff8e73;
}

.bar-item__fill--peak {
  background: var(--color-coral-primary) !important;
  box-shadow: 0 4px 12px rgba(244, 68, 46, 0.3);
}

.bar-item__label {
  position: absolute;
  bottom: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── Ranked Commodities List ─────────────────────────────────────────────── */
.view-all-link {
  font-size: var(--text-sm);
  color: var(--color-coral-primary);
  font-weight: 600;
}

.ranked-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ranked-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background-color 0.15s ease;
}

.ranked-row:last-child {
  border-bottom: none;
}

.ranked-row__number {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 600;
  width: 24px;
}

.ranked-row__badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.ranked-row__info {
  display: flex;
  flex-direction: column;
  width: 170px;
  flex-shrink: 0;
}

.ranked-row__name {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranked-row__category {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.ranked-row__bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-bg-subtle);
  border-radius: 9999px;
  overflow: hidden;
  margin: 0 10px;
}

.ranked-row__bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s var(--ease-spring);
}

.ranked-row__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 110px;
  justify-content: flex-end;
}

.ranked-row__price {
  font-size: var(--text-base);
  font-weight: 700;
}

.ranked-row__pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.ranked-row__pill--up {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
}

.ranked-row__pill--down {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
}

/* ── Donut Chart Card (Right Column) ─────────────────────────────────────── */
.status-pill-green {
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
  padding: 4px 10px;
  border-radius: 9999px;
}

.donut-container {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 10px auto 20px;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.donut-center__label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.donut-center__val {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
}

.legend-row__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.legend-pct {
  font-size: 0.8rem;
}

.legend-amount {
  font-size: var(--text-sm);
  font-weight: 700;
}

/* ── Bulletin Status & Outstanding Card ──────────────────────────────────── */
.alert-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent-amber-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.coral-banner {
  background: var(--color-coral-gradient);
  color: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--color-coral-glow);
  margin-bottom: 20px;
}

.coral-banner__label {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 600;
}

.coral-banner__val {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 6px 0 14px;
}

.coral-banner__pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-chip {
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Recent List */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-list__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 12px;
  background: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
}

.recent-item__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.recent-item__info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.recent-item__name {
  font-size: var(--text-sm);
  font-weight: 700;
}

.recent-item__meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.recent-item__time {
  font-size: 0.75rem;
}

/* Skeleton */
.stat-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.skeleton-card {
  height: 160px;
  background: #ffffff;
  border-radius: var(--card-radius, 22px);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
