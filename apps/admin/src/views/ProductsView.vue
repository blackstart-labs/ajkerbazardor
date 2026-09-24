<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPut } from '../api/client';
import { formatTaka, formatBnInt } from '@ajkerbazardor/shared';

interface Product {
  id: number;
  slug: string;
  nameBn: string;
  nameEn: string | null;
  categoryNameBn: string | null;
  unitLabel: string;
  sortOrder: number;
  isActive: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  direction: string | null;
  changePct: number | null;
}

const router = useRouter();
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const search = ref('');
const page = ref(1);
const total = ref(0);
const limit = 30;

onMounted(() => loadProducts());

async function loadProducts() {
  loading.value = true;
  error.value = null;
  try {
    const offset = (page.value - 1) * limit;
    const query: Record<string, unknown> = { limit, offset };
    if (search.value.trim()) {
      query['search'] = search.value.trim();
    }
    const res = await apiGet<{ ok: boolean; data: any }>('/admin/products', query);
    const data = res?.data;
    const rawItems = Array.isArray(data?.items) ? data.items : [];
    products.value = rawItems.map((p: any) => ({
      ...p,
      unitLabel: p.unitLabelBn ?? p.unitLabel ?? '',
      isActive: !p.archivedAt,
      minPrice: p.minPrice ?? null,
      maxPrice: p.maxPrice ?? null,
      direction: p.direction ?? null,
      changePct: p.changePct ?? null,
    }));
    total.value = data?.total ?? data?.meta?.total ?? 0;
  } catch {
    error.value = 'পণ্য তালিকা লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  loadProducts();
}

async function toggleActive(product: Product) {
  try {
    if (product.isActive) {
      await apiPut(`/admin/products/${product.id}/archive`);
      product.isActive = false;
    } else {
      await apiPut(`/admin/products/${product.id}/unarchive`);
      product.isActive = true;
    }
  } catch {
    alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
  }
}

const pages = computed(() => Math.ceil(total.value / limit));
</script>

<template>
  <div class="products-page">
    <div class="products-page__header">
      <h2 class="page-title">পণ্য তালিকা</h2>
      <div class="products-page__search">
        <input
          id="product-search"
          v-model="search"
          type="search"
          class="search-input"
          placeholder="পণ্য খুঁজুন…"
          @input="onSearch"
        />
      </div>
    </div>

    <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>

    <!-- Table -->
    <div class="table-wrap">
      <table class="data-table" aria-label="পণ্য তালিকা">
        <thead>
          <tr>
            <th>নাম (বাংলা)</th>
            <th>শ্রেণী</th>
            <th>একক</th>
            <th>আজকের দাম</th>
            <th>পরিবর্তন</th>
            <th>সক্রিয়</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 8" :key="n">
              <td colspan="7"><div class="skeleton-row" /></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="p in products" :key="p.id" class="data-row">
              <td class="data-row__name font-bn">{{ p.nameBn }}</td>
              <td class="text-muted font-bn">{{ p.categoryNameBn ?? '—' }}</td>
              <td class="text-muted">{{ p.unitLabel }}</td>
              <td class="font-bn">
                <span v-if="p.minPrice !== null">{{ formatTaka(p.minPrice) }}</span>
                <span v-if="p.maxPrice !== null && p.maxPrice !== p.minPrice"> – {{ formatTaka(p.maxPrice) }}</span>
                <span v-if="p.minPrice === null">—</span>
              </td>
              <td>
                <span
                  v-if="p.changePct !== null"
                  :class="{ 'text-up': p.direction === 'up', 'text-down': p.direction === 'down' }"
                >
                  {{ p.direction === 'up' ? '+' : '' }}{{ p.changePct?.toFixed(1) }}%
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'toggle-btn--on': p.isActive }"
                  :aria-pressed="p.isActive"
                  :aria-label="`${p.nameBn} ${p.isActive ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করুন`"
                  @click="toggleActive(p)"
                >
                  {{ p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়' }}
                </button>
              </td>
              <td>
                <button type="button" class="edit-btn" @click="router.push(`/products/${p.id}`)">সম্পাদনা</button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="7" class="empty-row">কোনো পণ্য পাওয়া যায়নি।</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pages > 1" class="pagination">
      <button
        type="button"
        class="page-btn"
        :disabled="page === 1"
        @click="
          page--;
          loadProducts();
        "
      >
        ← আগে
      </button>
      <span class="page-info">{{ formatBnInt(page) }} / {{ formatBnInt(pages) }}</span>
      <button
        type="button"
        class="page-btn"
        :disabled="page >= pages"
        @click="
          page++;
          loadProducts();
        "
      >
        পরে →
      </button>
    </div>
  </div>
</template>

<style scoped>
.products-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.search-input {
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border-strong);
  background: var(--color-bg-canvas);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  min-width: 240px;
  transition: border-color var(--duration-fast);
}

.search-input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.table-wrap {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: auto;
  box-shadow: var(--shadow-card);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th {
  text-align: left;
  background: var(--color-bg-subtle);
  padding: var(--space-2-5) var(--space-3);
  color: var(--color-text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: var(--space-2-5) var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.data-row:hover td {
  background-color: var(--color-bg-subtle);
}

.data-row:last-child td {
  border-bottom: none;
}

.data-row__name {
  font-weight: 600;
}

.toggle-btn {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.toggle-btn--on {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
  border-color: var(--color-trend-down-border);
}

.edit-btn {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-brand-primary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.edit-btn:hover {
  background: var(--color-brand-subtle);
  border-color: var(--color-brand-border);
}

.empty-row {
  text-align: center;
  padding: var(--space-8) !important;
  color: var(--color-text-muted);
}

.skeleton-row {
  height: 24px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.page-btn {
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg-surface);
  color: var(--color-brand-primary);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-brand-subtle);
  border-color: var(--color-brand-border);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.text-up {
  color: var(--color-trend-up);
  font-weight: 700;
}
.text-down {
  color: var(--color-trend-down);
  font-weight: 700;
}
.text-muted {
  color: var(--color-text-muted);
}
.font-bn {
  font-family: var(--font-body);
}
</style>
