<script setup lang="ts">
// Site-wide structured footer with brand info and categorized links
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand-col">
        <NuxtLink to="/" class="site-footer__brand" aria-label="আজকের বাজারদর হোম">
          <span class="site-footer__logo" aria-hidden="true">🛒</span>
          <strong class="site-footer__title">আজকের বাজারদর</strong>
        </NuxtLink>
        <p class="site-footer__desc">
          ঢাকার পাঁচটি প্রধান বাজারের দৈনিক নিত্যপ্রয়োজনীয় পণ্যের খুচরা বাজারদর — TCB বুলেটিন থেকে সংগৃহীত স্বাধীন
          মূল্য-তথ্য প্রকল্প। এটি কোনো সরকারি প্রতিষ্ঠানের অফিসিয়াল ওয়েবসাইট নয়।
        </p>
        <span class="site-footer__copy">
          © {{ new Date().getFullYear() }} আজকের বাজারদর • উন্মুক্ত নাগরিক মূল্য-তথ্য
        </span>
      </div>

      <div class="site-footer__nav-group">
        <div class="site-footer__col">
          <span class="site-footer__heading">বাজার ও পণ্য</span>
          <nav aria-label="Footer Market Links">
            <NuxtLink to="/prices">আজকের বাজারদর</NuxtLink>
            <NuxtLink to="/markets">বাজারসমূহ</NuxtLink>
            <NuxtLink to="/changes">দামের পরিবর্তন</NuxtLink>
            <NuxtLink to="/history">ঐতিহাসিক ডেটা</NuxtLink>
            <NuxtLink to="/search">পণ্য অনুসন্ধান</NuxtLink>
          </nav>
        </div>

        <div class="site-footer__col">
          <span class="site-footer__heading">প্রকল্প ও উৎস</span>
          <nav aria-label="Footer Info Links">
            <NuxtLink to="/about">উৎস ও পদ্ধতি</NuxtLink>
            <NuxtLink to="/methodology">ডেটা যাচাই পদ্ধতি</NuxtLink>
            <NuxtLink to="/about#disclaimer">আইনি অস্বীকৃতি</NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  margin-top: auto;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  padding: 3.5rem 1rem 2.5rem;
}

.site-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 3rem;
  flex-wrap: wrap;
}

.site-footer__brand-col {
  max-width: 34rem;
}

.site-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
}

.site-footer__logo {
  font-size: 1.35rem;
}

.site-footer__title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  color: var(--color-brand-primary);
}

.site-footer__desc {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.65;
  margin-bottom: 1rem;
}

.site-footer__copy {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  opacity: 0.8;
}

.site-footer__nav-group {
  display: flex;
  gap: 3.5rem;
  flex-wrap: wrap;
}

.site-footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.site-footer__heading {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-brand-primary);
}

.site-footer__col nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.site-footer__col a {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  text-decoration: none;
  transition: color 0.15s ease;
}

.site-footer__col a:hover {
  color: var(--color-brand-primary);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .site-footer {
    padding: 2.5rem 1rem 2rem;
  }
  .site-footer__inner {
    flex-direction: column;
    gap: 2.25rem;
  }
  .site-footer__nav-group {
    gap: 2.5rem;
  }
}
</style>
