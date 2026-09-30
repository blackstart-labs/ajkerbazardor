<script setup lang="ts">
import { useProductsStore } from '~/stores/products';

const products = useProductsStore();
const route = useRoute();
const q = ref((route.query['q'] as string) || '');

await useAsyncData('search-init', async () => {
  if (q.value) {
    products.setSearch(q.value);
  } else {
    await products.fetchProducts({ resetItems: true });
  }
  return true;
});

function run() {
  products.setSearch(q.value.trim());
}

function selectSuggestion(item: string) {
  q.value = item;
  run();
}

useSeoMeta({
  title: 'পণ্য অনুসন্ধান — আজকের বাজারদর',
  description: 'ঢাকার বাজারের নিত্যপ্রয়োজনীয় পণ্যের নাম লিখে দ্রুত সর্বশেষ দাম জানুন।',
  ogTitle: 'পণ্য অনুসন্ধান — আজকের বাজারদর',
  ogDescription: 'চাল, ডাল, তেল, সবজি, মাছ, মাংস সহ সকল পণ্যের খুচরা বাজারদর খুঁজুন।',
});

useScrollFade('.grid > *');
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="page-head">
        <p class="eyebrow">অনুসন্ধান</p>
        <h1>পণ্য খুঁজুন</h1>
        <p class="lead">ঢাকার খুচরা বাজারের ৬০+ পণ্যের মধ্যে আপনার প্রয়োজনীয় পণ্যের সর্বশেষ দর দেখুন।</p>
      </header>

      <form class="search-box" role="search" @submit.prevent="run">
        <label for="search-input" class="sr-only">পণ্য অনুসন্ধান</label>
        <input
          id="search-input"
          v-model="q"
          type="search"
          autocomplete="off"
          autofocus
          placeholder="যেমন: পেঁয়াজ, মিনিকেট চাল, সয়াবিন তেল, আলু..."
        />
        <button type="submit">খুঁজুন</button>
      </form>

      <div class="suggestions" aria-label="জনপ্রিয় অনুসন্ধান">
        <span class="suggestions-label">জনপ্রিয়:</span>
        <button
          v-for="s in ['পেঁয়াজ', 'মিনিকেট চাল', 'সয়াবিন তেল', 'ডিম', 'গোল আলু', 'রুই মাছ']"
          :key="s"
          type="button"
          class="suggestion-pill"
          @click="selectSuggestion(s)"
        >
          {{ s }}
        </button>
      </div>

      <section class="results">
        <div v-if="products.items.length > 0" class="grid" role="list">
          <div v-for="p in products.items" :key="p.id" role="listitem">
            <ProductCard v-bind="p" @click="(slug) => navigateTo(`/prices/${slug}`)" />
          </div>
        </div>
        <div v-else class="empty" role="status">
          <span class="empty-icon" aria-hidden="true">🔍</span>
          <p>“{{ q }}” সংক্রান্ত কোনো পণ্য পাওয়া যায়নি।</p>
          <small>শব্দটি পরিবর্তন করে আবার চেষ্টা করুন।</small>
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

.search-box {
  display: flex;
  max-width: 48rem;
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.25rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.search-box input {
  flex: 1;
  border: 0;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  outline: 0;
  color: var(--color-text-primary);
  background: transparent;
}

.search-box button {
  border: 0;
  background: var(--color-brand-primary);
  color: white;
  font-weight: 800;
  padding: 0 2rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-box button:hover {
  background: var(--color-brand-hover);
}

.suggestions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.suggestions-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.suggestion-pill {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.suggestion-pill:hover {
  color: var(--color-brand-primary);
  border-color: var(--color-brand-border);
  background: var(--color-bg-subtle);
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
  padding: 3.5rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
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
  .search-box {
    border-radius: 20px;
    flex-direction: column;
  }
  .search-box button {
    padding: 0.9rem;
  }
}
</style>
