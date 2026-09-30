<script setup lang="ts">
useSeoMeta({
  title: 'আমাদের সম্পর্কে — আজকের বাজারদর',
  description: 'ঢাকার দৈনিক নিত্যপ্রয়োজনীয় পণ্যের খুচরা বাজারদর সহজে বোঝার একটি স্বাধীন মূল্য-তথ্য প্ল্যাটফর্ম।',
  ogTitle: 'আজকের বাজারদর কী? — স্বাধীন প্রকল্প',
  ogDescription: 'TCB বুলেটিন থেকে সংগৃহীত স্বাধীন ও উন্মুক্ত নাগরিক মূল্য-তথ্য প্ল্যাটফর্ম।',
});

useStaggerFade('.timeline li', 0.05);
useScrollFade('.panel');
</script>

<template>
  <div class="page-shell">
    <SiteHeader />
    <main class="page">
      <header class="page-head">
        <p class="eyebrow">স্বাধীন নাগরিক প্রকল্প</p>
        <h1>আজকের বাজারদর কী?</h1>
        <p class="lead">
          ঢাকার দৈনিক নিত্যপ্রয়োজনীয় পণ্যের খুচরা বাজারদর সহজে বোঝার জন্য নির্মিত একটি উন্মুক্ত ও নিরপেক্ষ মূল্য-তথ্য
          প্ল্যাটফর্ম।
        </p>
      </header>

      <section id="disclaimer" class="panel panel--disclaimer">
        <div class="disclaimer-header">
          <span class="disclaimer-icon" aria-hidden="true">ℹ️</span>
          <h2>অফিসিয়াল TCB সাইট নয়</h2>
        </div>
        <p>
          আজকের বাজারদর একটি স্বাধীন উদ্যোগ। এটি ট্রেডিং কর্পোরেশন অব বাংলাদেশ (TCB) বা কোনো সরকারি প্রতিষ্ঠানের
          অফিসিয়াল ওয়েবসাইট নয় এবং TCB-এর সঙ্গে এটি ব্যবসায়িক বা প্রশাসনিকভাবে সম্পৃক্ত নয়। জনস্বার্থে সরকারি বুলেটিনের
          তথ্য ডিজিটাল ও সহজে পাঠযোগ্য আকারে উপস্থাপন করা হয়।
        </p>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>উৎস ও নির্ভরযোগ্যতা</h2>
          <p>
            প্রতিদিনের খুচরা বাজার বুলেটিন, যা TCB নিয়মিত প্রকাশ করে। আমরা সরাসরি উৎসের ফাইল সংগ্রহ করে স্বাভাবিকীকরণ ও
            যাচাই করে ওয়েবসাইটে প্রকাশ করি।
          </p>
        </article>

        <article class="panel">
          <h2>অন্তর্ভুক্ত ৫টি প্রধান বাজার</h2>
          <ul class="markets-list">
            <li><span>Mirpur-6</span> — মিরপুর বাজার</li>
            <li><span>Mohammadpur Town Hall</span> — টাউন হল বাজার</li>
            <li><span>New Market</span> — ঢাকা নিউমার্কেট</li>
            <li><span>Rampura</span> — রামপুরা কাঁচাবাজার</li>
            <li><span>Mohakhali</span> — মহাখালী বাজার</li>
          </ul>
        </article>
      </section>

      <section class="panel">
        <h2>ডেটা প্রক্রিয়াকরণ ধাপ</h2>
        <p class="section-desc">একটি দৈনিক বুলেটিন যেভাবে চূড়ান্ত তথ্যে রূপান্তরিত হয়:</p>
        <ol class="timeline" role="list">
          <li>
            <span class="step-num">১</span>
            <strong>TCB XLSX</strong>
            <small>দৈনিক বুলেটিন</small>
          </li>
          <li>
            <span class="step-num">২</span>
            <strong>আপলোড</strong>
            <small>অ্যাডমিন প্যানেল</small>
          </li>
          <li>
            <span class="step-num">৩</span>
            <strong>পার্সিং</strong>
            <small>অটোমেটেড রিডিং</small>
          </li>
          <li>
            <span class="step-num">৪</span>
            <strong>যাচাইকরণ</strong>
            <small>এরর চেক</small>
          </li>
          <li>
            <span class="step-num">৫</span>
            <strong>স্বাভাবিকীকরণ</strong>
            <small>ক্যাটাগরি ম্যাপিং</small>
          </li>
          <li>
            <span class="step-num">৬</span>
            <strong>ডাটাবেজ</strong>
            <small>সুরক্ষিত সংরক্ষণ</small>
          </li>
          <li>
            <span class="step-num">৭</span>
            <strong>লাইভ প্রকাশ</strong>
            <small>ওয়েব ও এপিআই</small>
          </li>
        </ol>
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
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1rem 4rem;
  flex: 1;
}

.page-head {
  margin-bottom: 2.5rem;
}

.eyebrow {
  color: var(--color-brand-primary);
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.page-head h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.3rem, 5vw, 4rem);
  margin: 0.3rem 0 0.5rem;
  color: #10231f;
}

.lead {
  color: var(--color-text-muted);
  font-size: 1.1rem;
  max-width: 42rem;
  line-height: 1.55;
}

.panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-card);
}

.panel h2 {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  color: #10231f;
  margin-bottom: 0.75rem;
}

.panel p {
  color: var(--color-text-secondary);
  line-height: 1.65;
  font-size: 0.98rem;
}

.panel--disclaimer {
  background: #fefce8;
  border-color: #fef08a;
}

.disclaimer-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.disclaimer-header h2 {
  margin-bottom: 0;
  color: #854d0e;
}

.disclaimer-icon {
  font-size: 1.4rem;
}

.panel--disclaimer p {
  color: #713f12;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.markets-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.markets-list li {
  padding: 0.6rem 0.85rem;
  background: var(--color-bg-subtle);
  border-radius: 12px;
  font-size: 0.92rem;
  color: var(--color-text-secondary);
}

.markets-list li span {
  font-weight: 700;
  color: var(--color-brand-primary);
}

.section-desc {
  margin-bottom: 1.25rem;
  color: var(--color-text-muted);
}

.timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  list-style: none;
  padding: 0;
}

.timeline li {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 1.2rem 0.85rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.timeline li:hover {
  transform: translateY(-2px);
  border-color: var(--color-brand-border);
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  color: white;
  font-weight: 800;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.timeline li strong {
  font-size: 0.92rem;
  color: var(--color-text-primary);
}

.timeline li small {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
