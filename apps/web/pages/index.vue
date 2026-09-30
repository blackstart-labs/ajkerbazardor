<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { useProductsStore } from '~/stores/products';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

useSeoMeta({
  title: 'আজকের বাজারদর — ঢাকার দৈনিক বাজারদর',
  description:
    'ঢাকার পাঁচটি বাজারের নিত্যপ্রয়োজনীয় পণ্যের দৈনিক খুচরা দাম — TCB বুলেটিন থেকে সংগৃহীত স্বাধীন মূল্য-তথ্য প্রকল্প।',
  ogTitle: 'আজকের বাজারদর — ঢাকার দৈনিক বাজারদর',
  ogDescription: 'ঢাকার পাঁচটি প্রধান বাজারের নিত্যপ্রয়োজনীয় পণ্যের দৈনিক খুচরা দাম — এক জায়গায়।',
  ogImage: 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg',
  ogUrl: 'https://ajkerbazardor.vercel.app',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg',
});

useHead({
  link: [{ rel: 'canonical', href: 'https://ajkerbazardor.vercel.app/' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'আজকের বাজারদর',
        url: 'https://ajkerbazardor.vercel.app',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://ajkerbazardor.vercel.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],
});

const dashboard = useDashboardStore();
const products = useProductsStore();
const selectedMarket = ref('all-dhaka');

useStaggerFade('.metric', 0.05);

const markets = [
  { slug: 'all-dhaka', name: 'ঢাকার ৫ বাজার', products: 60, updated: 'আজ' },
  { slug: 'mirpur-6', name: 'Mirpur-6', products: 60, updated: 'আজ' },
  { slug: 'mohammadpur-town-hall', name: 'Mohammadpur Town Hall', products: 60, updated: 'আজ' },
  { slug: 'new-market', name: 'New Market', products: 60, updated: 'আজ' },
  { slug: 'rampura', name: 'Rampura', products: 60, updated: 'আজ' },
  { slug: 'mohakhali', name: 'Mohakhali', products: 60, updated: 'আজ' },
];

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
  navigateTo(`/prices/${slug}`);
}

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
    <SiteHeader :latest-date="dashboard.latestDate" transparent @search="onSearch" />

    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__bg" aria-hidden="true">
        <img
          src="/images/hero-bazaar.jpg"
          alt=""
          class="hero__bg-img"
          width="1024"
          height="438"
          loading="eager"
          fetchpriority="high"
        />
        <div class="hero__bg-overlay" />
      </div>

      <div class="hero__container">
        <div class="hero__copy">
          <p class="eyebrow">TCB বুলেটিন থেকে সংগৃহীত • স্বাধীন প্রকল্প</p>
          <h1 id="hero-title">আজকের বাজারদর</h1>
          <p class="hero__lead">ঢাকার পাঁচটি বাজারের নিত্যপ্রয়োজনীয় পণ্যের দৈনিক খুচরা দাম — এক জায়গায়।</p>
          <form
            class="hero-search"
            role="search"
            @submit.prevent="onSearch(($event.target as HTMLFormElement).q.value)"
          >
            <label class="sr-only" for="hero-q">পণ্য খুঁজুন</label>
            <input id="hero-q" name="q" placeholder="আপনি কোন পণ্যের দাম জানতে চান?" />
            <button type="submit">দাম দেখুন</button>
          </form>
          <div class="hero__actions">
            <NuxtLink to="/prices" class="link-pill link-pill--primary">আজকের বাজার</NuxtLink>
            <NuxtLink to="/about" class="link-pill link-pill--secondary">কীভাবে ডেটা আসে</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <main id="main-content">
      <section class="section snapshot" aria-labelledby="snapshot-title">
        <div class="section-head">
          <p class="eyebrow">আজকের ডেটা</p>
          <h2 id="snapshot-title">আজকের বাজার এক নজরে</h2>
        </div>
        <div class="metrics">
          <article class="metric">
            <span>সর্বশেষ আপডেট</span
            ><strong>{{ dashboard.latestDate ? formatBnDate(dashboard.latestDate) : '—' }}</strong>
          </article>
          <article class="metric">
            <span>মোট পণ্য</span
            ><strong>{{ formatBnInt(dashboard.summary?.productCount ?? products.meta?.total ?? 0) }}</strong>
          </article>
          <article class="metric"><span>ট্র্যাক করা বাজার</span><strong>৫</strong></article>
          <article class="metric metric--up">
            <span>দাম বেড়েছে</span><strong>↑ {{ formatBnInt(dashboard.summary?.risingCount ?? 0) }}</strong>
          </article>
          <article class="metric metric--down">
            <span>দাম কমেছে</span><strong>↓ {{ formatBnInt(dashboard.summary?.fallingCount ?? 0) }}</strong>
          </article>
          <article class="metric">
            <span>অপরিবর্তিত</span><strong>— {{ formatBnInt(dashboard.summary?.unchangedCount ?? 0) }}</strong>
          </article>
        </div>
      </section>

      <section class="section" aria-labelledby="markets-title">
        <div class="section-head section-head--row">
          <div>
            <p class="eyebrow">বাজার</p>
            <h2 id="markets-title">বাজার নির্বাচন করুন</h2>
          </div>
          <NuxtLink to="/markets">সব বাজার দেখুন</NuxtLink>
        </div>
        <div class="market-strip" role="list">
          <button
            v-for="market in markets"
            :key="market.slug"
            type="button"
            class="market-pill"
            :class="{ 'market-pill--active': selectedMarket === market.slug }"
            @click="selectedMarket = market.slug"
          >
            <strong>{{ market.name }}</strong>
            <span>{{ formatBnInt(market.products) }} পণ্য • {{ market.updated }}</span>
          </button>
        </div>
      </section>

      <section class="section" aria-labelledby="categories-title">
        <div class="section-head section-head--row">
          <div>
            <p class="eyebrow">ক্যাটাগরি</p>
            <h2 id="categories-title">পণ্য ধরন</h2>
          </div>
          <div class="sort-wrap">
            <label for="sort-select">সাজান</label>
            <select
              id="sort-select"
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
        <CategoryNav :categories="products.categories" :active-slug="products.activeCategory" @select="onCategory" />
      </section>

      <section class="section" aria-labelledby="prices-title">
        <div class="section-head section-head--row">
          <div>
            <p class="eyebrow">বিক্রি নয়, তথ্য</p>
            <h2 id="prices-title">আজকের দাম</h2>
          </div>
          <NuxtLink to="/prices">ডেটা টেবিল দেখুন</NuxtLink>
        </div>
        <div v-if="products.error" class="state state--error" role="alert">
          <strong>দুঃখিত, বাজারদরের তথ্য এই মুহূর্তে লোড করা যাচ্ছে না।</strong>
          <button type="button" @click="products.fetchProducts({ resetItems: true })">আবার চেষ্টা করুন</button>
        </div>
        <div v-if="products.items.length > 0" class="products-grid" role="list" aria-label="পণ্য তালিকা">
          <div v-for="product in products.items" :key="product.id" role="listitem">
            <ProductCard v-bind="product" @click="onProductClick" />
          </div>
        </div>
        <div v-else-if="!products.loading" class="state">আজকের বাজারদর এখনও পাওয়া যায়নি।</div>
        <div v-if="products.loading" class="products-grid" aria-busy="true" aria-label="লোড হচ্ছে">
          <div v-for="n in 10" :key="n" class="skeleton-card" />
        </div>
        <div ref="sentinel" class="scroll-sentinel" aria-hidden="true" />
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
.hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  background-color: #0d1b18;
  overflow: hidden;
}
.hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}
.hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center right;
  display: block;
}
.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(13, 27, 24, 0.97) 0%,
    rgba(13, 27, 24, 0.92) 38%,
    rgba(13, 27, 24, 0.62) 65%,
    rgba(13, 27, 24, 0.2) 100%
  );
}
.hero__container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: calc(56px + clamp(1.5rem, 4vw, 3rem)) 1rem clamp(2rem, 5vw, 4rem);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.hero__copy {
  max-width: 620px;
  position: relative;
}
.hero__badge-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.hero__live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #fef3c7;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
.hero__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}
.hero__market-tag {
  display: inline-flex;
  align-items: center;
  background: #facc15;
  color: #7f1d1d;
  font-weight: 900;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  border: 1px solid #eab308;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.eyebrow {
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #34d399;
  font-size: 0.85rem;
}
.hero h1 {
  font-family: var(--font-heading);
  font-size: clamp(3rem, 7vw, 5.5rem);
  line-height: 1;
  margin: 0.4rem 0;
  color: #ffffff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
}
.hero__lead {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  max-width: 36rem;
  color: #e2e8f0;
  line-height: 1.5;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
}
.hero-search {
  margin-top: 1.5rem;
  display: flex;
  max-width: 44rem;
  background: white;
  border: 2px solid rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}
.hero-search input {
  flex: 1;
  border: 0;
  padding: 1rem 1.35rem;
  font-size: 1rem;
  outline: 0;
  color: #1c1917;
}
.hero-search button {
  border: 0;
  background: #b91c1c;
  color: white;
  font-weight: 800;
  padding: 0 1.6rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.hero-search button:hover {
  background: #991b1b;
}
.hero__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
}
.hero__disclaimer {
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-top: 1rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.link-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.7rem 1.2rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.2s ease;
}
.link-pill--primary {
  background: #facc15;
  color: #7f1d1d;
  border: 1px solid #facc15;
  box-shadow: 0 4px 14px rgba(250, 204, 21, 0.3);
}
.link-pill--primary:hover {
  background: #eab308;
  border-color: #eab308;
  text-decoration: none;
}
.link-pill--secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.link-pill--secondary:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
}
.section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.25rem 1rem;
}
.section-head {
  margin-bottom: 1rem;
}
.section-head h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  margin: 0.15rem 0;
  color: #10231f;
}
.section-head--row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.85rem;
}
.metric {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: var(--shadow-card);
}
.metric span {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.metric strong {
  display: block;
  margin-top: 0.3rem;
  font-size: 1.35rem;
}
.metric--up strong {
  color: var(--color-trend-up);
}
.metric--down strong {
  color: var(--color-trend-down);
}
.market-strip {
  display: flex;
  gap: 0.75rem;
  overflow: auto;
  padding: 0.25rem 0.1rem 0.75rem;
}
.market-pill {
  min-width: 210px;
  text-align: left;
  border: 1px solid var(--color-border-subtle);
  background: white;
  border-radius: 18px;
  padding: 1rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
}
.market-pill strong,
.market-pill span {
  display: block;
}
.market-pill span {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: 0.3rem;
}
.market-pill--active {
  background: #0f766e;
  color: white;
  border-color: #0f766e;
}
.market-pill--active span {
  color: #ccfbf1;
}
.sort-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sort-wrap select {
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: white;
  padding: 0 0.9rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}
.skeleton-card {
  height: 280px;
  border-radius: 18px;
  background: linear-gradient(90deg, #ebe5df 25%, #fff 50%, #ebe5df 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
.state {
  background: white;
  border: 1px dashed var(--color-border-strong);
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
}
.state--error {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  color: #7f1d1d;
  background: #fff1f2;
}
.state button {
  border: 0;
  border-radius: 999px;
  background: #0f766e;
  color: white;
  padding: 0.6rem 1rem;
  font-weight: 800;
}
.scroll-sentinel {
  height: 2px;
  margin-top: 2rem;
}
@media (max-width: 980px) {
  .hero {
    min-height: 100vh;
    min-height: 100dvh;
  }
  .hero__container {
    min-height: 100vh;
    min-height: 100dvh;
    padding-top: calc(56px + 2rem);
    padding-bottom: 2.5rem;
  }
  .hero__bg-overlay {
    background: linear-gradient(
      135deg,
      rgba(13, 27, 24, 0.95) 0%,
      rgba(13, 27, 24, 0.88) 50%,
      rgba(13, 27, 24, 0.55) 100%
    );
  }
  .metrics {
    grid-template-columns: repeat(3, 1fr);
  }
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .hero {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
  }
  .hero__bg-overlay {
    background: linear-gradient(
      180deg,
      rgba(13, 27, 24, 0.95) 0%,
      rgba(13, 27, 24, 0.88) 60%,
      rgba(13, 27, 24, 0.96) 100%
    );
  }
  .hero__container {
    min-height: 100vh;
    min-height: 100dvh;
    padding: calc(56px + 1.25rem) 1rem 2rem;
  }
  .hero-search {
    border-radius: 20px;
    flex-direction: column;
  }
  .hero-search button {
    padding: 0.9rem;
  }
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .section-head--row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
