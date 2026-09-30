<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { useProductsStore } from '~/stores/products';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

const route = useRoute();
const products = useProductsStore();
const dashboard = useDashboardStore();

const names: Record<string, string> = {
  'mirpur-6': 'Mirpur-6',
  'mohammadpur-town-hall': 'Mohammadpur Town Hall',
  'new-market': 'New Market',
  rampura: 'Rampura',
  mohakhali: 'Mohakhali',
};

const marketSlug = computed(() => route.params['market'] as string);
const marketName = computed(() => names[marketSlug.value] ?? 'ঢাকার বাজার');

await useAsyncData(`market-${marketSlug.value}`, async () => {
  await Promise.all([
    dashboard.fetchSummary(),
    products.fetchCategories(),
    products.fetchProducts({ resetItems: true }),
  ]);
  return true;
});

useSeoMeta({
  title: () => `${marketName.value} বাজারদর — আজকের বাজারদর`,
  description: () => `ঢাকার ${marketName.value} কাঁচাবাজারের দৈনিক খুচরা বাজারদর ও পণ্যের দামের পরিবর্তন।`,
  ogTitle: () => `${marketName.value} বাজারদর — আজকের বাজারদর`,
  ogDescription: () => `ঢাকার ${marketName.value} কাঁচাবাজারের সর্বশেষ খুচরা বাজারদর।`,
});

useStaggerFade('.stat-card', 0.05);
useScrollFade('.grid > *');
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="market-hero">
        <div class="market-hero__icon" aria-hidden="true">🏪</div>
        <div class="market-hero__content">
          <p class="eyebrow">বাজার প্রোফাইল</p>
          <h1>{{ marketName }} কাঁচাবাজার</h1>
          <div class="market-hero__meta">
            <span>সর্বশেষ আপডেট: {{ dashboard.latestDate ? formatBnDate(dashboard.latestDate) : 'আজ' }}</span>
            <span class="dot">•</span>
            <span>{{ formatBnInt(products.meta?.total ?? 60) }}টি পণ্য</span>
          </div>
        </div>
      </header>

      <section class="stats-row" aria-label="বাজারের সারসংক্ষেপ">
        <article class="stat-card">
          <span>মূল্য পরিবর্তন</span>
          <strong>
            ↑ {{ formatBnInt(dashboard.summary?.risingCount ?? 0) }} / ↓
            {{ formatBnInt(dashboard.summary?.fallingCount ?? 0) }}
          </strong>
        </article>
        <article class="stat-card">
          <span>অপরিবর্তিত পণ্য</span>
          <strong>— {{ formatBnInt(dashboard.summary?.unchangedCount ?? 0) }}</strong>
        </article>
        <article class="stat-card">
          <span>তথ্য যাচাই ও উৎস</span>
          <strong class="highlight">TCB দৈনিক বুলেটিন</strong>
        </article>
      </section>

      <section class="market-catalogue">
        <CategoryNav
          :categories="products.categories"
          :active-slug="products.activeCategory"
          @select="products.setCategory"
        />
        <div class="grid" role="list">
          <div v-for="p in products.items" :key="p.id" role="listitem">
            <ProductCard v-bind="p" @click="(slug) => navigateTo(`/prices/${slug}`)" />
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.page-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.page {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  flex: 1;
}

.market-hero {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 28px;
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
  margin-bottom: 1.5rem;
}

.market-hero__icon {
  font-size: 3rem;
  background: var(--color-bg-subtle);
  border-radius: 22px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyebrow {
  color: var(--color-brand-primary);
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

.market-hero h1 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 3rem);
  margin: 0.2rem 0;
  color: #10231f;
}

.market-hero__meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.market-hero__meta .dot {
  color: var(--color-border-strong);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.stat-card span {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-card strong {
  display: block;
  font-size: 1.35rem;
  margin-top: 0.35rem;
  color: #10231f;
}

.stat-card strong.highlight {
  color: var(--color-brand-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .market-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
