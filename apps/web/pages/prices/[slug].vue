<script setup lang="ts">
import { useProductsStore } from '~/stores/products';
import { formatPriceRange, formatTaka, formatChangePct } from '@ajkerbazardor/shared';
const route = useRoute();
const products = useProductsStore();
const slug = computed(() => route.params.slug as string);
const { error } = await useAsyncData(`price-${slug.value}`, async () => {
  await Promise.all([products.fetchProductBySlug(slug.value), products.fetchHistory(slug.value, '30d')]);
  return true;
});
const product = computed(() => products.currentProduct);
useSeoMeta({
  title: () => (product.value ? `${product.value.nameBn} বাজারদর — আজকের বাজারদর` : 'পণ্য পাওয়া যায়নি'),
  description: () =>
    product.value
      ? `${product.value.nameBn} আজকের দাম ${formatPriceRange(product.value.minPrice, product.value.maxPrice)}। ঢাকার ৫টি খুচরা বাজারের তথ্য।`
      : '',
  ogTitle: () => (product.value ? `${product.value.nameBn} বাজারদর — আজকের বাজারদর` : ''),
  ogDescription: () =>
    product.value
      ? `${product.value.nameBn} আজকের দাম ${formatPriceRange(product.value.minPrice, product.value.maxPrice)}`
      : '',
  ogImage: () => product.value?.imageUrl || 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg',
  twitterCard: 'summary_large_image',
});
useHead(() => ({
  link: [{ rel: 'canonical', href: `https://ajkerbazardor.vercel.app/prices/${slug.value}` }],
  script: product.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.value.nameBn,
            description: `${product.value.nameBn} দৈনিক খুচরা বাজারদর`,
            image: product.value.imageUrl || 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'BDT',
              lowPrice: product.value.minPrice,
              highPrice: product.value.maxPrice,
            },
          }),
        },
      ]
    : [],
}));
const marketRows = ['Mirpur-6', 'Mohammadpur Town Hall', 'New Market', 'Rampura', 'Mohakhali'];
useStaggerFade('.panel', 0.08);
</script>
<template>
  <div>
    <SiteHeader />
    <main v-if="product" class="pdp">
      <NuxtLink to="/prices" class="back">← সব বাজারদর</NuxtLink>
      <section class="hero">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.nameBn" />
        <div>
          <p class="eyebrow">পণ্য বাজারদর</p>
          <h1>{{ product.nameBn }} বাজারদর</h1>
          <p class="unit">{{ product.unitLabel }}</p>
          <div class="price">{{ formatPriceRange(product.minPrice, product.maxPrice) }}</div>
          <p class="movement" :class="`movement--${product.direction}`">
            {{ product.direction === 'up' ? '↑' : product.direction === 'down' ? '↓' : '—' }}
            {{ formatChangePct(product.changePct ?? null) }} আজ
          </p>
          <p class="note">এই পণ্য বিক্রির জন্য নয়; এটি TCB বুলেটিনভিত্তিক মূল্য-তথ্য।</p>
        </div>
      </section>
      <section class="grid">
        <article class="panel panel--wide">
          <PriceHistoryChart
            :data="products.history"
            :loading="products.pdpLoading"
            :active-range="products.historyRange"
            @range-change="(r: string) => products.fetchHistory(slug, r)"
          />
        </article>
        <article class="panel">
          <h2>আজ কোন বাজারে কত?</h2>
          <p class="muted">TCB বুলেটিন বাজারভিত্তিক আলাদা দাম না দিলে নিচের টেবিলটি একই উৎস-রেঞ্জ দেখায়।</p>
          <table>
            <tbody>
              <tr v-for="m in marketRows" :key="m">
                <td>{{ m }}</td>
                <td>{{ formatTaka(product.minPrice) }}</td>
                <td>
                  <div class="bar"><span /></div>
                </td>
              </tr>
            </tbody>
          </table>
        </article>
      </section>
    </main>
    <main v-else class="pdp">
      <div class="state">{{ error ? 'পণ্য পাওয়া যায়নি।' : 'লোড হচ্ছে…' }}</div>
    </main>
    <SiteFooter />
  </div>
</template>
<style scoped>
.pdp {
  max-width: 1180px;
  margin: auto;
  padding: 2rem 1rem;
}
.back {
  color: var(--color-brand-primary);
  font-weight: 800;
}
.hero {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: center;
  margin-top: 1rem;
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 30px;
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}
.hero img {
  width: 100%;
  border-radius: 22px;
}
.eyebrow {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.hero h1 {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 4.5rem);
  margin: 0.2rem 0;
}
.unit,
.muted,
.note {
  color: var(--color-text-muted);
}
.price {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 900;
  color: #10231f;
}
.movement {
  font-weight: 900;
}
.movement--up {
  color: var(--color-trend-up);
}
.movement--down {
  color: var(--color-trend-down);
}
.grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 1rem;
  margin-top: 1rem;
}
.panel {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  padding: 1rem;
  box-shadow: var(--shadow-card);
}
.panel h2 {
  font-family: var(--font-heading);
}
table {
  width: 100%;
  border-collapse: collapse;
}
td {
  padding: 0.65rem;
  border-bottom: 1px solid var(--color-border-subtle);
}
.bar {
  height: 10px;
  background: #f4efeb;
  border-radius: 99px;
}
.bar span {
  display: block;
  width: 70%;
  height: 100%;
  border-radius: 99px;
  background: var(--color-brand-primary);
}
.state {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
}
@media (max-width: 800px) {
  .hero,
  .grid {
    grid-template-columns: 1fr;
  }
  .price {
    font-size: 2.2rem;
  }
}
</style>
