<script setup lang="ts">
const route = useRoute();
useHead(() => ({ title: `Source ${route.params.date} — আজকের বাজারদর` }));
</script>
<template>
  <div>
    <SiteHeader />
    <main class="page">
      <p>Source bulletin</p>
      <h1>{{ route.params.date }}</h1>
      <dl>
        <div>
          <dt>Source organization</dt>
          <dd>Trading Corporation of Bangladesh (TCB)</dd>
        </div>
        <div>
          <dt>Markets covered</dt>
          <dd>Mirpur-6, Mohammadpur Town Hall, New Market, Rampura, Mohakhali</dd>
        </div>
        <div>
          <dt>Products</dt>
          <dd>৬০</dd>
        </div>
        <div>
          <dt>Publication timestamp</dt>
          <dd>ডেটাসেটে সংরক্ষিত হলে দেখানো হবে</dd>
        </div>
      </dl>
      <p class="note">ডাউনলোডযোগ্য উৎস ফাইল প্রকাশের আগে নিরাপত্তা ও অনুমতির নীতি নিশ্চিত করা প্রয়োজন।</p>
    </main>
  </div>
</template>
<style scoped>
.page {
  max-width: 860px;
  margin: 2rem auto;
  padding: 2rem 1rem;
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
}
.page > p {
  color: var(--color-brand-primary);
  font-weight: 900;
}
h1 {
  font-family: var(--font-heading);
  font-size: 3rem;
}
dl div {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1rem;
  border-top: 1px solid var(--color-border-subtle);
  padding: 1rem 0;
}
dt {
  font-weight: 900;
}
.note {
  background: #fef3c7;
  border-radius: 16px;
  padding: 1rem;
}
@media (max-width: 640px) {
  dl div {
    grid-template-columns: 1fr;
  }
}
</style>
