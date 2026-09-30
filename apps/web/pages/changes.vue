<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { useProductsStore } from '~/stores/products';
import { formatBnInt } from '@ajkerbazardor/shared';

const dashboard = useDashboardStore();
const products = useProductsStore();
const tab = ref<'up' | 'down' | 'same'>('up');

await useAsyncData('changes', async () => {
  await Promise.all([dashboard.fetchMovers(), products.fetchProducts({ resetItems: true })]);
  return true;
});

const visible = computed(() =>
  products.items.filter((p) => (tab.value === 'same' ? p.direction === 'same' : p.direction === tab.value)),
);

useSeoMeta({
  title: 'দামের পরিবর্তন — আজকের বাজারদর',
  description: 'আজ ঢাকার বাজারে কোন কোন পণ্যের দাম বেড়েছে, কমেছে বা অপরিবর্তিত রয়েছে তার সম্পূর্ণ তালিকা।',
  ogTitle: 'আজকের বাজারদর — দৈনিক দামের পরিবর্তন',
  ogDescription: 'ঢাকার খুচরা বাজারে দামের দৈনিক হ্রাস-বৃদ্ধি এক নজরে।',
});

useScrollFade('.grid > *');
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="page-head">
        <p class="eyebrow">দৈনিক ওঠানামা</p>
        <h1>দামের পরিবর্তন</h1>
        <p class="lead">
          আজ ঢাকার বাজারে কোন পণ্যের দাম বেড়েছে, কমেছে অথবা অপরিবর্তিত রয়েছে — স্পষ্ট ভিজ্যুয়াল ইন্ডিকেটরসহ।
        </p>
      </header>

      <div class="tabs" role="tablist" aria-label="মূল্য পরিবর্তনের ধরন">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'up'"
          class="tab-btn tab-btn--up"
          :class="{ active: tab === 'up' }"
          @click="tab = 'up'"
        >
          ↑ আজ দাম বেড়েছে ({{ formatBnInt(dashboard.summary?.risingCount ?? 0) }})
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'down'"
          class="tab-btn tab-btn--down"
          :class="{ active: tab === 'down' }"
          @click="tab = 'down'"
        >
          ↓ আজ দাম কমেছে ({{ formatBnInt(dashboard.summary?.fallingCount ?? 0) }})
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'same'"
          class="tab-btn tab-btn--same"
          :class="{ active: tab === 'same' }"
          @click="tab = 'same'"
        >
          — অপরিবর্তিত ({{ formatBnInt(dashboard.summary?.unchangedCount ?? 0) }})
        </button>
      </div>

      <div v-if="visible.length > 0" class="grid" role="list">
        <div v-for="p in visible" :key="p.id" role="listitem">
          <ProductCard v-bind="p" @click="(slug) => navigateTo(`/prices/${slug}`)" />
        </div>
      </div>
      <div v-else class="empty">
        <p>এই ক্যাটাগরিতে এই মুহূর্তে কোনো তথ্য নেই।</p>
      </div>
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
  padding: 2.5rem 1rem 4rem;
  flex: 1;
}

.page-head {
  margin-bottom: 2rem;
}

.eyebrow {
  color: var(--color-brand-primary);
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.page-head h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  margin: 0.3rem 0 0.5rem;
  color: #10231f;
}

.lead {
  color: var(--color-text-muted);
  font-size: 1.05rem;
  max-width: 36rem;
  line-height: 1.5;
}

.tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 2rem 0;
}

.tab-btn {
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-surface);
  border-radius: 999px;
  padding: 0.75rem 1.4rem;
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--color-text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-btn:hover {
  border-color: var(--color-brand-primary);
  transform: translateY(-1px);
}

.tab-btn.active {
  background: var(--color-brand-primary);
  color: white;
  border-color: var(--color-brand-primary);
  box-shadow: 0 4px 14px rgba(15, 118, 110, 0.25);
}

.tab-btn--up.active {
  background: var(--color-trend-up);
  border-color: var(--color-trend-up);
  box-shadow: 0 4px 14px rgba(185, 28, 28, 0.25);
}

.tab-btn--down.active {
  background: var(--color-trend-down);
  border-color: var(--color-trend-down);
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.25rem;
}

.empty {
  background: var(--color-bg-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: 20px;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .page {
    padding: 1.5rem 1rem 3rem;
  }
  .tabs {
    flex-direction: column;
  }
}
</style>
