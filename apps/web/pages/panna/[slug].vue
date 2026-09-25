<script setup lang="ts">
import { useProductsStore } from '~/stores/products';
import { formatBnDate, formatTaka, formatChangePct, formatPriceRange } from '@ajkerbazardor/shared';

const route = useRoute();
const router = useRouter();
const products = useProductsStore();

const slug = computed(() => route.params['slug'] as string);

// Fetch on server
const { error } = await useAsyncData(`product-${slug.value}`, async () => {
  await Promise.all([products.fetchProductBySlug(slug.value), products.fetchHistory(slug.value, '30d')]);
  return true;
});

// Meta
const product = computed(() => products.currentProduct);

useHead(() => ({
  title: product.value ? `${product.value.nameBn} আজকের দাম — আজকের বাজার দর` : 'পণ্য পাওয়া যায়নি',
  meta: [
    {
      name: 'description',
      content: product.value
        ? `${product.value.nameBn} আজকের খুচরা দাম ঢাকার বাজারে: ${formatPriceRange(product.value.minPrice, product.value.maxPrice)}।`
        : '',
    },
  ],
}));

// History range switching
async function switchRange(range: string) {
  await products.fetchHistory(slug.value, range);
}
</script>

<template>
  <div>
    <SiteHeader />

    <!-- Back button -->
    <div class="container pdp-nav">
      <button type="button" class="back-btn" @click="router.back()">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        ফিরে যান
      </button>
    </div>

    <!-- 404 state -->
    <div v-if="error || (!products.pdpLoading && !product)" class="container pdp-error">
      <h1 class="pdp-error__title">পণ্য পাওয়া যায়নি</h1>
      <p class="pdp-error__text">এই পণ্যের তথ্য পাওয়া যাচ্ছে না।</p>
      <NuxtLink to="/" class="pdp-error__link">হোম পেজে ফিরুন</NuxtLink>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="products.pdpLoading" class="container pdp-skeleton">
      <div class="pdp-skeleton__hero" aria-busy="true" />
      <div class="pdp-skeleton__body" />
    </div>

    <!-- Product Detail -->
    <main v-else-if="product" id="main-content" class="container pdp">
      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="pdp__header">
        <div class="pdp__left">
          <div v-if="product.imageUrl" class="pdp__image-wrapper">
            <img :src="product.imageUrl" :alt="product.nameBn" class="pdp__image" />
          </div>
          <div class="pdp__meta">
            <span v-if="product.categoryNameBn" class="pdp__category">{{ product.categoryNameBn }}</span>
            <h1 class="pdp__name">{{ product.nameBn }}</h1>
            <p class="pdp__unit">
              {{ product.unitLabel.startsWith('প্রতি') ? product.unitLabel : `প্রতি ${product.unitLabel}` }}
            </p>
          </div>
        </div>

        <div class="pdp__hero-price">
          <div class="pdp__price-range">
            <span class="pdp__price-min">{{ formatTaka(product.minPrice) }}</span>
            <span v-if="product.maxPrice !== null && product.maxPrice !== product.minPrice" class="pdp__price-sep">
              –
            </span>
            <span v-if="product.maxPrice !== null && product.maxPrice !== product.minPrice" class="pdp__price-max">{{
              formatTaka(product.maxPrice)
            }}</span>
          </div>
          <div
            v-if="product.changePct !== null"
            class="pdp__change-badge"
            :class="{
              'pdp__change-badge--up': product.direction === 'up',
              'pdp__change-badge--down': product.direction === 'down',
            }"
          >
            {{ formatChangePct(product.changePct ?? null) }}
            <span class="pdp__change-since">গতকাল থেকে</span>
          </div>
        </div>
      </div>

      <!-- ── Context Anchors ─────────────────────────────────────────── -->
      <div class="pdp__context-row" aria-label="মূল্য প্রেক্ষাপট">
        <div
          v-for="(ctx, label) in {
            আজ: product.today,
            'এই সপ্তাহ': product.week,
            'এই মাস': product.month,
            'এই বছর': product.year,
          }"
          :key="label"
          class="context-card"
        >
          <span class="context-card__label">{{ label }}</span>
          <span class="context-card__price">{{ ctx ? formatPriceRange(ctx.minPrice, ctx.maxPrice) : '—' }}</span>
          <span
            v-if="ctx && ctx.changePct !== null"
            class="context-card__pct"
            :class="{
              'context-card__pct--up': ctx.direction === 'up',
              'context-card__pct--down': ctx.direction === 'down',
            }"
          >
            {{ formatChangePct(ctx.changePct ?? null) }}
          </span>
        </div>
      </div>

      <!-- ── History Chart ───────────────────────────────────────────── -->
      <section class="pdp__chart-section" aria-label="মূল্য ইতিহাস">
        <ClientOnly>
          <PriceHistoryChart
            :data="products.history"
            :loading="products.pdpLoading"
            :active-range="products.historyRange"
            @range-change="switchRange"
          />
          <template #fallback>
            <div class="pdp__chart-placeholder" aria-label="চার্ট লোড হচ্ছে" style="height: 280px" />
          </template>
        </ClientOnly>
      </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="container">
        <p class="site-footer__text">মূল্য তথ্য সূত্র: <abbr title="ট্রেডিং কর্পোরেশন অব বাংলাদেশ">টিসিবি</abbr></p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* ── Back nav ─────────────────────────────────────────────────────────────── */
.pdp-nav {
  padding-top: var(--space-4);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-1) 0;
  transition: color var(--duration-fast);
}

.back-btn:hover {
  color: var(--color-brand-primary);
}

/* ── Error ────────────────────────────────────────────────────────────────── */
.pdp-error {
  padding: var(--space-16) 0;
  text-align: center;
}

.pdp-error__title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-3);
}

.pdp-error__text {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.pdp-error__link {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--color-brand-primary);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  transition: background-color var(--duration-fast);
}

.pdp-error__link:hover {
  background-color: var(--color-brand-hover);
  text-decoration: none;
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
.pdp-skeleton {
  padding-top: var(--space-6);
}

.pdp-skeleton__hero,
.pdp-skeleton__body {
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: var(--space-4);
}

.pdp-skeleton__hero {
  height: 200px;
}
.pdp-skeleton__body {
  height: 320px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── PDP layout ──────────────────────────────────────────────────────────── */
.pdp {
  padding-top: var(--space-6);
  padding-bottom: var(--space-16);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.pdp__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.pdp__left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.pdp__image-wrapper {
  width: 90px;
  height: 90px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.pdp__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pdp__category {
  display: inline-block;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-brand-primary);
  background-color: var(--color-brand-subtle);
  border: 1px solid var(--color-brand-border);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.625rem;
  margin-bottom: var(--space-2);
}

.pdp__name {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
}

.pdp__unit {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.pdp__hero-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.pdp__price-range {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.pdp__price-sep {
  color: var(--color-text-muted);
}

.pdp__change-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
}

.pdp__change-badge--up {
  background-color: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
}

.pdp__change-badge--down {
  background-color: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
  border: 1px solid var(--color-trend-down-border);
}

.pdp__change-since {
  font-weight: 400;
  font-size: var(--text-xs);
  opacity: 0.8;
}

/* ── Context Anchors ─────────────────────────────────────────────────────── */
.pdp__context-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

@media (max-width: 640px) {
  .pdp__context-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.context-card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.context-card__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.context-card__price {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.context-card__pct {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
}

.context-card__pct--up {
  color: var(--color-trend-up);
}
.context-card__pct--down {
  color: var(--color-trend-down);
}

/* ── Chart Section ───────────────────────────────────────────────────────── */
.pdp__chart-section {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.pdp__chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.pdp__chart-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.range-tabs {
  display: flex;
  gap: var(--space-1);
}

.range-tab {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.range-tab--active,
.range-tab:hover {
  background-color: var(--color-brand-primary);
  color: #fff;
  border-color: var(--color-brand-primary);
}

.pdp__chart-wrap {
  width: 100%;
}

.pdp__chart-placeholder {
  height: 280px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
}

.pdp__chart-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-family: var(--font-body);
}

/* Footer ────────────────────────────────────────────────────────────────── */
.site-footer {
  background-color: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border-subtle);
  padding: var(--space-6) 0;
  margin-top: var(--space-8);
}

.site-footer__text {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
