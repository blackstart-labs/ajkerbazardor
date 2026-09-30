<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPut } from '../api/client';
import { formatTaka, formatBnInt } from '@ajkerbazardor/shared';

interface Category {
  id: number;
  slug: string;
  nameBn: string;
}

interface SparklinePoint {
  date: string;
  mid: number | null;
}

interface Product {
  id: number;
  slug: string;
  nameBn: string;
  categoryNameBn: string | null;
  unitLabel: string;
  isActive: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  midPrice: number | null;
  direction: 'up' | 'down' | 'same' | null;
  changePct: number | null;
  sparkline: SparklinePoint[];
}

const router = useRouter();
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const search = ref('');
const selectedCategory = ref('');
const page = ref(1);
const total = ref(0);
const limit = 20;

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts()]);
});

async function loadCategories() {
  try {
    const res = await apiGet<{ ok: boolean; data: Category[] }>('/categories');
    if (Array.isArray(res?.data)) {
      categories.value = res.data;
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function loadProducts() {
  loading.value = true;
  error.value = null;
  try {
    const query: Record<string, unknown> = {
      page: page.value,
      limit,
    };
    if (search.value.trim()) {
      query['q'] = search.value.trim();
    }
    if (selectedCategory.value) {
      query['category'] = selectedCategory.value;
    }

    const res = await apiGet<{ ok: boolean; data: any }>('/products', query);
    const data = res?.data;
    const rawItems = Array.isArray(data?.items) ? data.items : [];

    products.value = rawItems.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      nameBn: p.nameBn,
      categoryNameBn: p.category?.nameBn ?? p.categoryNameBn ?? '',
      unitLabel: p.unit?.labelBn ?? p.unitLabelBn ?? p.unitLabel ?? '',
      isActive: !p.archivedAt,
      minPrice: p.price?.min ?? p.minPrice ?? null,
      maxPrice: p.price?.max ?? p.maxPrice ?? null,
      midPrice: p.price?.mid ?? null,
      direction: p.price?.direction ?? p.direction ?? 'same',
      changePct: p.price?.changePct ?? p.changePct ?? null,
      sparkline: Array.isArray(p.sparkline) ? p.sparkline : [],
    }));

    total.value = data?.total ?? 0;
  } catch (err) {
    console.error('Failed to load products:', err);
    error.value = 'পণ্য তালিকা লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function onSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadProducts();
  }, 300);
}

function onCategoryChange() {
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

// Sparkline mathematical calculations
function getSparklinePoints(sparkline?: SparklinePoint[]): number[] {
  if (!sparkline || sparkline.length === 0) return [];
  return sparkline
    .map((s) => s.mid)
    .filter((m): m is number => m !== null && typeof m === 'number' && Number.isFinite(m));
}

function getSparklinePath(sparkline?: SparklinePoint[], w = 100, h = 28): string {
  const pts = getSparklinePoints(sparkline);
  if (pts.length < 2) return '';
  const padX = 4;
  const padY = 4;
  const usableW = w - padX * 2;
  const usableH = h - padY * 2;

  let min = Math.min(...pts);
  let max = Math.max(...pts);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  const stepX = usableW / (pts.length - 1);

  const coords = pts.map((val, idx) => {
    const x = padX + idx * stepX;
    const y = h - padY - ((val - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${coords.join(' L ')}`;
}

function getSparklineArea(sparkline?: SparklinePoint[], w = 100, h = 28): string {
  const line = getSparklinePath(sparkline, w, h);
  if (!line) return '';
  const pts = getSparklinePoints(sparkline);
  const padX = 4;
  const usableW = w - padX * 2;
  const stepX = usableW / (pts.length - 1);
  const lastX = (padX + (pts.length - 1) * stepX).toFixed(1);

  return `${line} L ${lastX},${h} L ${padX},${h} Z`;
}

function getSparklineTooltip(p: Product): string {
  const pts = getSparklinePoints(p.sparkline);
  if (pts.length === 0) return `${p.nameBn}: কোনো দর ধারা ডেটা নেই`;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const latest = pts[pts.length - 1];
  return `${p.nameBn}: সর্বশেষ দর ${latest} ৳ (পরিসর: ${min} - ${max} ৳, ${pts.length} দিনের ধারা)`;
}

const pages = computed(() => Math.ceil(total.value / limit) || 1);
</script>

<template>
  <div class="products-page">
    <div class="products-page__header">
      <div>
        <h2 class="page-title">পণ্য তালিকা ও দর ধারা</h2>
        <p class="page-subtitle text-muted font-bn">
          মোট {{ formatBnInt(total) }}টি পণ্যের বাজার দর, সাপ্তাহিক পরিবর্তন এবং দর ধারা গ্রাফ
        </p>
      </div>

      <!-- Controls: Category Filter + Search -->
      <div class="products-page__controls">
        <select
          v-model="selectedCategory"
          class="category-select font-bn"
          aria-label="ক্যাটাগরি ফিল্টার"
          @change="onCategoryChange"
        >
          <option value="">সব ক্যাটাগরি</option>
          <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
            {{ cat.nameBn }}
          </option>
        </select>

        <div class="search-wrapper">
          <svg
            class="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="product-search"
            v-model="search"
            type="search"
            class="search-input font-bn"
            placeholder="পণ্য খুঁজুন (চাল, ডাল, তেল)…"
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>

    <!-- Products Table -->
    <div class="table-wrap">
      <table class="data-table" aria-label="পণ্য তালিকা ও গ্রাফ">
        <thead>
          <tr>
            <th>পণ্য (বাংলা)</th>
            <th>শ্রেণী</th>
            <th>একক</th>
            <th>আজকের দর</th>
            <th>পরিবর্তন</th>
            <th>দর ধারা (গ্রাফ)</th>
            <th>স্ট্যাটাস</th>
            <th class="text-right">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading Skeletons -->
          <template v-if="loading">
            <tr v-for="n in 8" :key="n">
              <td colspan="8"><div class="skeleton-row" /></td>
            </tr>
          </template>

          <template v-else>
            <tr v-for="p in products" :key="p.id" class="data-row">
              <!-- Name -->
              <td class="data-row__name font-bn">
                <span class="product-title">{{ p.nameBn }}</span>
              </td>

              <!-- Category -->
              <td class="text-muted font-bn">
                <span class="category-tag">{{ p.categoryNameBn || '—' }}</span>
              </td>

              <!-- Unit -->
              <td class="text-muted font-bn">{{ p.unitLabel }}</td>

              <!-- Today's Price -->
              <td class="font-bn font-semibold tabular-nums">
                <template v-if="p.minPrice !== null">
                  <span>{{ formatTaka(p.minPrice) }}</span>
                  <span v-if="p.maxPrice !== null && p.maxPrice !== p.minPrice"> – {{ formatTaka(p.maxPrice) }}</span>
                </template>
                <span v-else class="text-muted">—</span>
              </td>

              <!-- Price Change Pill -->
              <td>
                <span
                  v-if="p.changePct !== null && p.changePct !== 0"
                  class="change-pill tabular-nums font-bn"
                  :class="{ 'change-pill--up': p.direction === 'up', 'change-pill--down': p.direction === 'down' }"
                >
                  {{ p.direction === 'up' ? '↑ +' : '↓ ' }}{{ Math.abs(p.changePct).toFixed(1) }}%
                </span>
                <span v-else class="change-pill change-pill--same font-bn">০.০%</span>
              </td>

              <!-- ── Price Trend Graph (Sparkline) ─────────────────────── -->
              <td class="sparkline-cell">
                <div class="sparkline-wrapper" :title="getSparklineTooltip(p)">
                  <svg
                    v-if="getSparklinePoints(p.sparkline).length >= 2"
                    viewBox="0 0 100 28"
                    class="sparkline-svg"
                    :class="`sparkline--${p.direction || 'same'}`"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient :id="`prod-grad-${p.id}`" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="currentColor" stop-opacity="0.32" />
                        <stop offset="100%" stop-color="currentColor" stop-opacity="0.0" />
                      </linearGradient>
                    </defs>
                    <!-- Area fill under the curve -->
                    <path
                      v-if="getSparklineArea(p.sparkline)"
                      :d="getSparklineArea(p.sparkline)"
                      :fill="`url(#prod-grad-${p.id})`"
                    />
                    <!-- Curve stroke -->
                    <path
                      v-if="getSparklinePath(p.sparkline)"
                      :d="getSparklinePath(p.sparkline)"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span v-else class="sparkline-empty text-muted font-bn">— স্থির —</span>

                  <span v-if="p.sparkline?.length" class="sparkline-days text-muted tabular-nums font-bn">
                    {{ p.sparkline.length }}দ
                  </span>
                </div>
              </td>

              <!-- Status Toggle -->
              <td>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'toggle-btn--on': p.isActive }"
                  :aria-pressed="p.isActive"
                  :aria-label="`${p.nameBn} ${p.isActive ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করুন`"
                  @click="toggleActive(p)"
                >
                  <span class="toggle-dot" />
                  {{ p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়' }}
                </button>
              </td>

              <!-- Edit Action -->
              <td class="text-right">
                <button type="button" class="edit-btn" title="সম্পাদনা করুন" @click="router.push(`/products/${p.id}`)">
                  সম্পাদনা
                </button>
              </td>
            </tr>

            <!-- Empty Row -->
            <tr v-if="products.length === 0">
              <td colspan="8" class="empty-row text-muted font-bn">
                কোনো পণ্য খুঁজে পাওয়া যায়নি। অনুসন্ধান বা ফিল্টার পরিবর্তন করুন।
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pages > 1" class="pagination">
      <button
        type="button"
        class="page-btn font-bn"
        :disabled="page === 1"
        @click="
          page--;
          loadProducts();
        "
      >
        ← আগের পাতা
      </button>

      <span class="page-info tabular-nums font-bn"> পাতা {{ formatBnInt(page) }} / {{ formatBnInt(pages) }} </span>

      <button
        type="button"
        class="page-btn font-bn"
        :disabled="page >= pages"
        @click="
          page++;
          loadProducts();
        "
      >
        পরের পাতা →
      </button>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
  line-height: 1.2;
}

.page-subtitle {
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}

/* Controls */
.products-page__controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.category-select {
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) ease;
}

.category-select:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  height: 40px;
  padding: 0 var(--space-3) 0 36px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  min-width: 240px;
  transition: all var(--duration-fast, 150ms) ease;
}

.search-input:focus {
  border-color: var(--color-coral-primary);
  box-shadow: 0 0 0 3px var(--color-coral-subtle);
  background: #ffffff;
}

/* Table */
.table-wrap {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  overflow: auto;
  box-shadow: var(--card-shadow);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th {
  text-align: left;
  background: var(--color-bg-canvas);
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 14px 18px;
  border-bottom: 1.5px solid var(--color-border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
  font-size: var(--text-sm);
  transition: background-color var(--duration-fast, 150ms) ease;
}

.data-row:hover td {
  background-color: var(--color-bg-subtle);
}

.product-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.category-tag {
  display: inline-block;
  font-size: var(--text-xs);
  background: var(--color-bg-canvas);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
}

.font-semibold {
  font-weight: 600;
}

/* Change Pill */
.change-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
  white-space: nowrap;
}

.change-pill--up {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
}

.change-pill--down {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border: 1px solid var(--color-trend-down-border);
}

.change-pill--same {
  background: var(--color-trend-same-bg);
  color: var(--color-trend-same);
  border: 1px solid var(--color-trend-same-border);
}

/* Sparkline in Table */
.sparkline-cell {
  min-width: 140px;
}

.sparkline-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.sparkline-svg {
  width: 96px;
  height: 28px;
  display: block;
}

.sparkline--up {
  color: var(--color-trend-up);
}

.sparkline--down {
  color: var(--color-trend-down);
}

.sparkline--same {
  color: var(--color-brand-primary);
}

.sparkline-days {
  font-size: 0.7rem;
}

.sparkline-empty {
  font-size: var(--text-xs);
}

/* Toggle Switch */
.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-canvas);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) ease;
}

.toggle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.toggle-btn--on {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down);
  border-color: var(--color-trend-down-border);
}

/* Action Edit Button */
.edit-btn {
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-coral-primary);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) ease;
}

.edit-btn:hover {
  background: var(--color-coral-gradient);
  color: #ffffff;
  border-color: transparent;
  box-shadow: var(--color-coral-glow);
}

.text-right {
  text-align: right;
}

/* Skeleton Row */
.skeleton-row {
  height: 24px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.empty-row {
  text-align: center;
  padding: var(--space-8) var(--space-4) !important;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.page-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-strong);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
