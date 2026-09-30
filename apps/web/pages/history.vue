<script setup lang="ts">
import { useProductsStore } from '~/stores/products';

const products = useProductsStore();
const selected = ref('আজ');

await useAsyncData('history-page', async () => {
  await products.fetchProducts({ resetItems: true });
  return true;
});

useSeoMeta({
  title: 'ঐতিহাসিক বাজারদর — আজকের বাজারদর',
  description: 'ঢাকার বাজারের ঐতিহাসিক খুচরা মূল্যতালিকা ও অতীত বাজারদরের আর্কাইভ।',
  ogTitle: 'ঐতিহাসিক বাজারদর — আর্কাইভ',
  ogDescription: 'তারিখ অনুযায়ী অতীত বাজারদরের তুলনামূলক চিত্র।',
});

useScrollFade('.grid > *');
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="page-head">
        <p class="eyebrow">তারিখভিত্তিক রেকর্ড</p>
        <h1>ঐতিহাসিক বাজারদর</h1>
        <p class="lead">
          অতীত বাজারদর দেখার সময় আমরা স্পষ্টভাবে সময়কাল প্রদর্শন করি, যাতে পূর্বের তথ্য সাম্প্রতিক মনে না হয়।
        </p>
      </header>

      <div class="datebar" aria-label="সময়সীমা নির্বাচন">
        <div class="datebar__presets">
          <button
            v-for="d in ['আজ', 'গতকাল', 'গত ৭ দিন', 'গত ৩০ দিন']"
            :key="d"
            type="button"
            :class="{ active: selected === d }"
            class="preset-btn"
            @click="selected = d"
          >
            {{ d }}
          </button>
        </div>
        <div class="datebar__picker">
          <label for="custom-date" class="sr-only">নির্দিষ্ট তারিখ</label>
          <input id="custom-date" type="date" aria-label="নির্দিষ্ট তারিখ" class="date-input" />
        </div>
      </div>

      <div class="notice" role="status">
        <span class="notice__icon" aria-hidden="true">📅</span>
        <span
          >বর্তমান নির্বাচন: <strong>{{ selected }}</strong
          >-এর বাজারদর রেকর্ড।</span
        >
      </div>

      <div class="grid" role="list">
        <div v-for="p in products.items.slice(0, 15)" :key="p.id" role="listitem">
          <ProductCard v-bind="p" @click="(slug) => navigateTo(`/prices/${slug}`)" />
        </div>
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
  max-width: 38rem;
  line-height: 1.5;
}

.datebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.75rem 0 1.25rem;
}

.datebar__presets {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.preset-btn {
  height: 42px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-surface);
  border-radius: 999px;
  padding: 0 1.25rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.preset-btn:hover {
  border-color: var(--color-brand-primary);
  transform: translateY(-1px);
}

.preset-btn.active {
  background: var(--color-brand-primary);
  color: white;
  border-color: var(--color-brand-primary);
  box-shadow: 0 4px 14px rgba(15, 118, 110, 0.25);
}

.date-input {
  height: 42px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-surface);
  border-radius: 999px;
  padding: 0 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  outline: none;
}

.date-input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.notice {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-brand-border);
  border-radius: 16px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 2rem;
  font-size: 0.92rem;
  color: var(--color-brand-ink);
}

.notice__icon {
  font-size: 1.15rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.25rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 640px) {
  .page {
    padding: 1.5rem 1rem 3rem;
  }
  .datebar {
    flex-direction: column;
    align-items: stretch;
  }
  .date-input {
    width: 100%;
  }
}
</style>
