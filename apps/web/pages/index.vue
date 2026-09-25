<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { useProductsStore } from '~/stores/products';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

// SEO
useHead({
  title: 'আজকের বাজার দর — ঢাকার খুচরা বাজারের দৈনিক দাম',
  meta: [
    {
      name: 'description',
      content: 'ঢাকার বাজারে আজকে কত দামে বিক্রি হচ্ছে চাল, ডাল, তেল, সবজি, মাছ, মাংস? TCB-র দৈনিক খুচরা মূল্য।',
    },
  ],
});

const dashboard = useDashboardStore();
const products = useProductsStore();

// Server-side fetch
await useAsyncData('home-init', async () => {
  await Promise.all([
    dashboard.fetchSummary(),
    dashboard.fetchMovers(),
    products.fetchCategories(),
    products.fetchProducts({ resetItems: true }),
  ]);
  return true;
});

function onSearch(q: string) {
  products.setSearch(q);
}

function onCategory(slug: string | null) {
  products.setCategory(slug);
}

function onSort(sort: string) {
  products.setSort(sort as import('~/stores/products').SortKey);
}

function onProductClick(slug: string) {
  navigateTo(`/panna/${slug}`);
}

// Infinite scroll — next page on scroll sentinel visibility
const sentinel = ref<HTMLElement | null>(null);
const { stop } = useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting && products.meta && products.meta.page < products.meta.pages && !products.loading) {
      products.fetchProducts({ page: (products.meta?.page ?? 1) + 1 });
    }
  },
  { threshold: 0.1 },
);
onUnmounted(() => stop());
</script>

<template>
  <div>
    <!-- ── Site Header ──────────────────────────────────────────────────── -->
    <SiteHeader :latest-date="dashboard.latestDate" @search="onSearch" />

    <!-- ── Hero / Summary Banner ──────────────────────────────────────── -->
    <section v-if="dashboard.summary" class="hero-banner" aria-label="আজকের বাজার সারসংক্ষেপ">
      <div class="container">
        <div class="hero-banner__content">
          <h1 class="hero-banner__title">
            আজকের বাজার দর
            <span class="hero-banner__date">
              {{ formatBnDate(dashboard.summary.date) }}
            </span>
          </h1>
          <p class="hero-banner__subtitle">ঢাকার খুচরা বাজারের TCB-র দৈনিক মূল্য তালিকা।</p>

          <!-- Stat Row -->
          <div class="hero-stats" role="list">
            <div class="hero-stat" role="listitem">
              <span class="hero-stat__value">{{ formatBnInt(dashboard.summary.productCount) }}</span>
              <span class="hero-stat__label">মোট পণ্য</span>
            </div>
            <div class="hero-stat hero-stat--up" role="listitem">
              <span class="hero-stat__value">{{ formatBnInt(dashboard.summary.risingCount) }}</span>
              <span class="hero-stat__label">মূল্য বেড়েছে</span>
            </div>
            <div class="hero-stat hero-stat--down" role="listitem">
              <span class="hero-stat__value">{{ formatBnInt(dashboard.summary.fallingCount) }}</span>
              <span class="hero-stat__label">মূল্য কমেছে</span>
            </div>
            <div class="hero-stat" role="listitem">
              <span class="hero-stat__value">{{ formatBnInt(dashboard.summary.unchangedCount) }}</span>
              <span class="hero-stat__label">অপরিবর্তিত</span>
            </div>
          </div>
        </div>

        <!-- Top Movers (risers + fallers) -->
        <div v-if="dashboard.moversDay" class="movers-row">
          <div class="movers-col">
            <h2 class="movers-col__title movers-col__title--up">
              <span aria-hidden="true">↑</span> সবচেয়ে বেশি বেড়েছে
            </h2>
            <ul class="movers-list">
              <li v-for="m in dashboard.moversDay.risers.slice(0, 4)" :key="m.id" class="movers-item movers-item--up">
                <NuxtLink :to="`/panna/${m.slug}`" class="movers-item__link">
                  <span class="movers-item__name">{{ m.nameBn }}</span>
                  <span class="movers-item__pct">{{ m.changePct !== null ? `+${m.changePct.toFixed(1)}%` : '' }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="movers-col">
            <h2 class="movers-col__title movers-col__title--down">
              <span aria-hidden="true">↓</span> সবচেয়ে বেশি কমেছে
            </h2>
            <ul class="movers-list">
              <li
                v-for="m in dashboard.moversDay.fallers.slice(0, 4)"
                :key="m.id"
                class="movers-item movers-item--down"
              >
                <NuxtLink :to="`/panna/${m.slug}`" class="movers-item__link">
                  <span class="movers-item__name">{{ m.nameBn }}</span>
                  <span class="movers-item__pct">{{ m.changePct !== null ? `${m.changePct.toFixed(1)}%` : '' }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Category Nav + Filter Bar ──────────────────────────────────── -->
    <div class="filter-bar">
      <div class="container">
        <!-- Category pills -->
        <CategoryNav :categories="products.categories" :active-slug="products.activeCategory" @select="onCategory" />

        <!-- Sort select -->
        <div class="filter-bar__sort">
          <label for="sort-select" class="sr-only">সাজান</label>
          <select
            id="sort-select"
            class="sort-select"
            :value="products.sort"
            @change="onSort(($event.target as HTMLSelectElement).value)"
          >
            <option value="sort_order">স্বাভাবিক</option>
            <option value="price_asc">দাম ↑</option>
            <option value="price_desc">দাম ↓</option>
            <option value="change_desc">পরিবর্তন ↑</option>
            <option value="change_asc">পরিবর্তন ↓</option>
            <option value="name">নাম অনুযায়ী</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ── Products Grid ───────────────────────────────────────────────── -->
    <main id="main-content" class="container products-section">
      <!-- Error state -->
      <div v-if="products.error" class="error-banner" role="alert">
        {{ products.error }}
      </div>

      <!-- Grid -->
      <div v-if="products.items.length > 0" class="products-grid" role="list" aria-label="পণ্য তালিকা">
        <div v-for="product in products.items" :key="product.id" role="listitem">
          <ProductCard v-bind="product" @click="onProductClick" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!products.loading" class="empty-state">
        <p class="empty-state__text">কোনো পণ্য পাওয়া যায়নি।</p>
      </div>

      <!-- Skeleton loading -->
      <div v-if="products.loading" class="products-grid products-grid--loading" aria-busy="true" aria-label="লোড হচ্ছে">
        <div v-for="n in 8" :key="`sk-${n}`" class="skeleton-card" aria-hidden="true" />
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="scroll-sentinel" aria-hidden="true" />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <footer class="site-footer">
      <div class="container">
        <p class="site-footer__text">
          মূল্য তথ্য সূত্র: <abbr title="ট্রেডিং কর্পোরেশন অব বাংলাদেশ">টিসিবি</abbr> — Trading Corporation of
          Bangladesh. এই তথ্য শুধুমাত্র তথ্যগত উদ্দেশ্যে প্রদান করা হয়েছে।
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Layout helpers ──────────────────────────────────────────────────────── */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ── Hero Banner ─────────────────────────────────────────────────────────── */
.hero-banner {
  background: linear-gradient(
    135deg,
    var(--color-brand-subtle) 0%,
    var(--color-bg-surface) 60%,
    var(--color-bg-canvas) 100%
  );
  border-bottom: 1px solid var(--color-brand-border);
  padding: var(--space-8) 0 var(--space-6);
}

.hero-banner__content {
  margin-bottom: var(--space-6);
}

.hero-banner__title {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-2);
}

.hero-banner__date {
  display: inline-block;
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: var(--color-brand-primary);
  margin-left: var(--space-2);
}

.hero-banner__subtitle {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

/* ── Stat Row ────────────────────────────────────────────────────────────── */
.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero-stat {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  min-width: 100px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.hero-stat--up {
  border-color: var(--color-trend-up-border);
  background-color: var(--color-trend-up-bg);
}

.hero-stat--down {
  border-color: var(--color-trend-down-border);
  background-color: var(--color-trend-down-bg);
}

.hero-stat__value {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.hero-stat--up .hero-stat__value {
  color: var(--color-trend-up);
}

.hero-stat--down .hero-stat__value {
  color: var(--color-trend-down);
}

.hero-stat__label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-0-5);
}

/* ── Movers Row ──────────────────────────────────────────────────────────── */
.movers-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

@media (max-width: 640px) {
  .movers-row {
    grid-template-columns: 1fr;
  }
}

.movers-col__title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.movers-col__title--up {
  color: var(--color-trend-up);
}

.movers-col__title--down {
  color: var(--color-trend-down);
}

.movers-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.movers-item {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.movers-item__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1-5) var(--space-3);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  border-radius: var(--radius-sm);
  transition: background-color var(--duration-fast);
}

.movers-item--up .movers-item__link {
  background-color: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
}

.movers-item--up .movers-item__link:hover {
  background-color: var(--color-trend-up-border);
}

.movers-item--down .movers-item__link {
  background-color: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
}

.movers-item--down .movers-item__link:hover {
  background-color: var(--color-trend-down-border);
}

.movers-item__name {
  font-weight: 500;
}

.movers-item__pct {
  font-weight: 700;
  font-size: var(--text-xs);
}

/* ── Filter Bar ──────────────────────────────────────────────────────────── */
.filter-bar {
  background-color: var(--color-bg-canvas);
  border-bottom: 1px solid var(--color-border-subtle);
  position: sticky;
  top: 56px; /* below site header */
  z-index: 40;
}

.filter-bar .container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  overflow: hidden;
}

.filter-bar__sort {
  margin-left: auto;
  flex-shrink: 0;
  padding: var(--space-2-5) 0;
}

.sort-select {
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
  transition: border-color var(--duration-fast);
}

.sort-select:focus {
  border-color: var(--color-brand-primary);
}

/* ── Products Section ────────────────────────────────────────────────────── */
.products-section {
  padding-top: var(--space-6);
  padding-bottom: var(--space-16);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* Skeleton cards */
.skeleton-card {
  height: 280px;
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

/* Error & Empty ─────────────────────────────────────────────────────────── */
.error-banner {
  background-color: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.empty-state {
  padding: var(--space-16) 0;
  text-align: center;
}

.empty-state__text {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--color-text-muted);
}

.scroll-sentinel {
  height: 2px;
  margin-top: var(--space-8);
}

/* ── Site Footer ─────────────────────────────────────────────────────────── */
.site-footer {
  background-color: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border-subtle);
  padding: var(--space-6) 0;
  margin-top: auto;
}

.site-footer__text {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
  line-height: var(--leading-relaxed);
}
</style>
