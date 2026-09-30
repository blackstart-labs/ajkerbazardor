<script setup lang="ts">
import { useStaggerFade } from '~/composables/use-motion';

useHead({
  title: 'উৎস ও তথ্য পদ্ধতি — আজকের বাজারদর',
  meta: [
    {
      name: 'description',
      content:
        'টিসিবি (TCB) বুলেটিনের তথ্য কীভাবে সংগ্রহ, যাচাই ও প্রকাশ করা হয় — বিস্তারিত পদ্ধতি ও স্বচ্ছতা সংক্রান্ত নীতিমালা।',
    },
  ],
});

onMounted(() => {
  useStaggerFade('.method-card', 0.08);
});
</script>

<template>
  <div class="methodology-page">
    <SiteHeader />

    <main id="main-content" class="page-container">
      <header class="page-header">
        <span class="badge">স্বচ্ছতা ও পদ্ধতি</span>
        <h1>তথ্য সংগ্রহ ও প্রক্রিয়াকরণ পদ্ধতি</h1>
        <p class="subtitle">
          দৈনন্দিন বাজারদর তথ্যের নির্ভুলতা ও স্বচ্ছতা নিশ্চিত করতে আমরা কীভাবে ডেটা প্রক্রিয়াজাত করি।
        </p>
      </header>

      <div class="cards-grid">
        <section class="method-card">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <h2>প্রাথমিক উৎস: টিসিবি দৈনিক মূল্য তালিকা</h2>
          <p>
            আমাদের তথ্যের মূল উৎস গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের বাণিজ্য মন্ত্রণালয়াধীন ট্রেডিং কর্পোরেশন অব বাংলাদেশ
            (TCB)-এর দৈনিক বাজারদর মূল্যতালিকা প্রতিবেদন। সরকারি ছুটির দিন ব্যতীত প্রতি কার্যদিবসে এই তথ্য প্রকাশিত হয়।
          </p>
        </section>

        <section class="method-card">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2>স্বয়ংক্রিয় পার্সিং ও ডেটা যাচাই</h2>
          <p>
            পিডিএফ ও বুলেটিনের টেবিল থেকে অ্যালগরিদমিক পদ্ধতিতে পণ্যের নাম, ইউনিট, সর্বনিম্ন ও সর্বোচ্চ খুচরা মূল্য
            শনাক্ত করা হয়। মূল্যে কোন রূপ ম্যানুয়াল পরিবর্তন করা হয় না।
          </p>
        </section>

        <section class="method-card">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>শূন্য ও অনুপস্থিত মান নীতি</h2>
          <p>
            কোনো পণ্যের মূল্য তালিকা থেকে বাদ পড়লে অথবা তথ্য অপ্রাপ্য থাকলে আমরা তা কখনই কৃত্রিমভাবে ০ (শূন্য) টাকা
            দেখাই না। অনুপস্থিত ডেটা স্পষ্টভাবে '—' হিসেবে উপস্থাপিত হয়, যাতে বিভ্রান্তি এড়ানো যায়।
          </p>
        </section>

        <section class="method-card">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2>পরিবর্তন ও ট্রেন্ড বিশ্লেষণ</h2>
          <p>
            পূর্ববর্তী প্রকাশিত তথ্যের সাথে তুলনা করে মূল্যবৃদ্ধি বা হ্রাসের হার (শতাংশ) গাণিতিকভাবে নির্ধারিত হয়।
            দীর্ঘমেয়াদী গতিবিধি বুঝতে ৭ দিন, ৩০ দিন, ৬ মাস ও ১ বছরের ট্রেন্ড চার্ট সরবরাহ করা হয়।
          </p>
        </section>
      </div>

      <div class="cta-box">
        <h3>আরও বিস্তারিত জানতে চান?</h3>
        <p>আমাদের ডেটাবেজ ও প্রকল্প সম্পর্কে বিস্তারিত জানতে সাধারণ প্রশ্ন ও পরিচিতি পাতা দেখুন।</p>
        <div class="cta-actions">
          <NuxtLink to="/about" class="btn btn-primary">পরিচিতি ও প্রেক্ষাপট</NuxtLink>
          <NuxtLink to="/prices" class="btn btn-outline">আজকের বাজারদর দেখুন</NuxtLink>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.methodology-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-canvas);
}

.page-container {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
  flex: 1;
}

.page-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3rem;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--color-brand-subtle);
  color: var(--color-brand-primary);
  font-size: var(--text-xs);
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  line-height: 1.6;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.method-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast),
    box-shadow var(--duration-fast);
}

.method-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-brand-border);
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-brand-subtle);
  color: var(--color-brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.method-card h2 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.method-card p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.cta-box {
  background: linear-gradient(135deg, var(--color-brand-subtle) 0%, rgba(15, 118, 110, 0.08) 100%);
  border: 1px solid var(--color-brand-border);
  border-radius: var(--radius-2xl);
  padding: 2.5rem 2rem;
  text-align: center;
}

.cta-box h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.cta-box p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-bottom: 1.5rem;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.4rem;
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--duration-fast);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: #fff;
  border: 1px solid var(--color-brand-primary);
}

.btn-primary:hover {
  background: var(--color-brand-hover);
  color: #fff;
}

.btn-outline {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
}

.btn-outline:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}
</style>
