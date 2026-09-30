<script setup lang="ts">
useSeoMeta({
  title: 'ঢাকার বাজারসমূহ — আজকের বাজারদর',
  description:
    'ঢাকার ৫টি প্রধান খুচরা বাজার: Mirpur-6, Mohammadpur Town Hall, New Market, Rampura, Mohakhali এর দৈনিক দর।',
  ogTitle: 'ঢাকার বাজারসমূহ — আজকের বাজারদর',
  ogDescription: 'ঢাকার পাঁচটি প্রধান বাজারের নিত্যপ্রয়োজনীয় পণ্যের খুচরা বাজারদর।',
  ogImage: 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg',
});

const markets = [
  { slug: 'mirpur-6', name: 'Mirpur-6', desc: 'মিরপুর এলাকার প্রধান খুচরা বাজার', count: 60 },
  { slug: 'mohammadpur-town-hall', name: 'Mohammadpur Town Hall', desc: 'মোহাম্মদপুর টাউন হল কাঁচাবাজার', count: 60 },
  { slug: 'new-market', name: 'New Market', desc: 'ঢাকা নিউমার্কেট কাঁচাবাজার', count: 60 },
  { slug: 'rampura', name: 'Rampura', desc: 'রামপুরা কাঁচাবাজার ও নিত্যপণ্য', count: 60 },
  { slug: 'mohakhali', name: 'Mohakhali', desc: 'মহাখালী কাঁচাবাজার এলাকা', count: 60 },
];

useStaggerFade('.market-card', 0.06);
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="page-head">
        <p class="eyebrow">ঢাকার বাজার</p>
        <h1>ট্র্যাক করা ৫ বাজার</h1>
        <p class="lead">TCB বুলেটিনে কভার করা বাজারগুলোর ভিত্তিতে সামগ্রিক খুচরা দাম দেখানো হয়।</p>
      </header>

      <div class="grid" role="list">
        <NuxtLink v-for="m in markets" :key="m.slug" :to="`/markets/${m.slug}`" class="market-card" role="listitem">
          <div class="market-card__icon" aria-hidden="true">🏪</div>
          <div class="market-card__body">
            <h2>{{ m.name }}</h2>
            <p>{{ m.desc }}</p>
            <div class="market-card__meta">
              <span>{{ m.count }} পণ্য</span>
              <span class="dot">•</span>
              <span class="badge">সর্বশেষ বুলেটিন</span>
            </div>
          </div>
          <div class="market-card__arrow" aria-hidden="true">→</div>
        </NuxtLink>
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
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.market-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.market-card:hover {
  border-color: var(--color-brand-border);
  box-shadow: 0 12px 30px rgba(15, 118, 110, 0.12);
  transform: translateY(-2px);
  text-decoration: none;
}

.market-card__icon {
  font-size: 2.5rem;
  background: var(--color-bg-subtle);
  border-radius: 18px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.market-card__body {
  flex: 1;
}

.market-card__body h2 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: #10231f;
  margin-bottom: 0.25rem;
}

.market-card__body p {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin-bottom: 0.65rem;
  line-height: 1.4;
}

.market-card__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-brand-primary);
  font-weight: 700;
}

.market-card__meta .dot {
  color: var(--color-border-strong);
}

.market-card__meta .badge {
  background: var(--color-bg-subtle);
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.market-card__arrow {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.market-card:hover .market-card__arrow {
  transform: translateX(4px);
  color: var(--color-brand-primary);
}

@media (max-width: 640px) {
  .page {
    padding: 1.5rem 1rem 3rem;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
