<script setup lang="ts">
import { useProductsStore } from '~/stores/products';
import { formatTaka } from '@ajkerbazardor/shared';
const products = useProductsStore();
await useAsyncData('prices-page', async () => {
  await Promise.all([products.fetchCategories(), products.fetchProducts({ resetItems: true })]);
  return true;
});
useHead({ title: 'সব বাজারদর — আজকের বাজারদর' });
useStaggerFade('tbody tr', 0.02);
function openProduct(slug: string) {
  navigateTo(`/prices/${slug}`);
}
</script>
<template>
  <div>
    <SiteHeader @search="products.setSearch" />
    <main class="page">
      <header class="page-head">
        <p>ডেটা টেবিল</p>
        <h1>সব পণ্যের বাজারদর</h1>
        <span>খোঁজা, ক্যাটাগরি, দাম ও পরিবর্তন অনুযায়ী সাজানো।</span>
      </header>
      <section class="toolbar" aria-label="ফিল্টার">
        <input
          v-model="products.searchQuery"
          type="search"
          placeholder="পণ্য খুঁজুন..."
          @input="products.fetchProducts({ resetItems: true })"
        />
        <select v-model="products.sort" @change="products.fetchProducts({ resetItems: true })">
          <option value="sort_order">স্বাভাবিক</option>
          <option value="price_asc">দাম কম থেকে বেশি</option>
          <option value="price_desc">দাম বেশি থেকে কম</option>
          <option value="change_desc">বৃদ্ধি বেশি</option>
          <option value="change_asc">হ্রাস বেশি</option>
          <option value="name">নাম</option>
        </select>
        <select v-model="products.activeCategory" @change="products.fetchProducts({ resetItems: true })">
          <option :value="null">সব ক্যাটাগরি</option>
          <option v-for="c in products.categories" :key="c.id" :value="c.slug">{{ c.nameBn }}</option>
        </select>
      </section>
      <div v-if="products.error" class="state state--error">দুঃখিত, বাজারদরের তথ্য এই মুহূর্তে লোড করা যাচ্ছে না।</div>
      <section class="table-card">
        <table aria-label="সব পণ্যের দাম">
          <thead>
            <tr>
              <th>পণ্য</th>
              <th>ক্যাটাগরি</th>
              <th>ইউনিট</th>
              <th>আজকের দাম</th>
              <th>পরিবর্তন</th>
              <th>বাজার</th>
              <th>আপডেট</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products.items" :key="p.id" @click="openProduct(p.slug)">
              <td>
                <strong>{{ p.nameBn }}</strong>
              </td>
              <td>{{ p.categoryNameBn ?? '—' }}</td>
              <td>{{ p.unitLabel }}</td>
              <td>
                {{ formatTaka(p.minPrice)
                }}<template v-if="p.maxPrice && p.maxPrice !== p.minPrice"> – {{ formatTaka(p.maxPrice) }}</template>
              </td>
              <td>
                <span :class="['change', `change--${p.direction}`]"
                  >{{ p.direction === 'up' ? '↑' : p.direction === 'down' ? '↓' : '—' }} {{ p.changePct ?? 0 }}%</span
                >
              </td>
              <td>ঢাকার ৫ বাজার</td>
              <td>{{ products.meta ? 'সর্বশেষ' : '—' }}</td>
            </tr>
            <tr v-if="!products.loading && products.items.length === 0">
              <td colspan="7" class="empty">কোনো পণ্য পাওয়া যায়নি।</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>
<style scoped>
.page {
  max-width: 1280px;
  margin: auto;
  padding: 2rem 1rem;
}
.page-head p {
  color: var(--color-brand-primary);
  font-weight: 800;
}
.page-head h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.2rem, 5vw, 4rem);
  margin: 0.2rem 0;
}
.page-head span {
  color: var(--color-text-muted);
}
.toolbar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}
.toolbar input,
.toolbar select {
  height: 44px;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: white;
  padding: 0 1rem;
}
.toolbar input {
  min-width: min(100%, 360px);
  flex: 1;
}
.table-card {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 22px;
  box-shadow: var(--shadow-card);
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  white-space: nowrap;
}
th {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
tbody tr {
  cursor: pointer;
}
tbody tr:hover {
  background: var(--color-bg-canvas);
}
.change {
  font-weight: 800;
}
.change--up {
  color: var(--color-trend-up);
}
.change--down {
  color: var(--color-trend-down);
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem !important;
}
.state {
  padding: 1rem;
  border-radius: 16px;
  margin: 1rem 0;
}
.state--error {
  background: #fff1f2;
  color: #7f1d1d;
}
@media (max-width: 720px) {
  .table-card {
    background: transparent;
    border: 0;
    box-shadow: none;
    overflow: visible;
  }
  table,
  thead,
  tbody,
  tr,
  td {
    display: block;
  }
  thead {
    display: none;
  }
  tr {
    background: white;
    border: 1px solid var(--color-border-subtle);
    border-radius: 18px;
    margin: 0.75rem 0;
    padding: 0.5rem;
  }
  td {
    border: 0;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    white-space: normal;
  }
  td:before {
    content: attr(data-label);
    font-weight: 800;
    color: var(--color-text-muted);
  }
}
</style>
