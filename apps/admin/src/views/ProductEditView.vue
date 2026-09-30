<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPut } from '../api/client';
import { formatTaka } from '@ajkerbazardor/shared';

const route = useRoute();
const router = useRouter();
const productId = computed(() => Number(route.params['id']));

interface Product {
  id: number;
  slug: string;
  nameBn: string;
  nameEn: string | null;
  categoryId: number | null;
  categoryNameBn: string | null;
  unitLabel: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

const product = ref<Product | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const form = reactive({
  nameBn: '',
  nameEn: '',
  unitLabel: '',
  sortOrder: 0,
  isActive: true,
});

onMounted(async () => {
  try {
    const res = await apiGet<{ ok: boolean; data: any }>(`/admin/products/${productId.value}`);
    const data = res.data;
    product.value = {
      ...data,
      unitLabel: data.unitLabelBn ?? data.unitLabel ?? '',
      isActive: !data.archivedAt,
    };
    form.nameBn = data.nameBn ?? '';
    form.nameEn = data.nameEn ?? '';
    form.unitLabel = data.unitLabelBn ?? data.unitLabel ?? '';
    form.sortOrder = data.sortOrder ?? 0;
    form.isActive = !data.archivedAt;
  } catch {
    error.value = 'পণ্য লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  error.value = null;
  success.value = false;
  try {
    await apiPut(`/admin/products/${productId.value}`, {
      nameBn: form.nameBn,
      nameEn: form.nameEn || null,
      sortOrder: form.sortOrder,
    });
    if (product.value) {
      if (!form.isActive && product.value.isActive) {
        await apiPut(`/admin/products/${productId.value}/archive`);
        product.value.isActive = false;
      } else if (form.isActive && !product.value.isActive) {
        await apiPut(`/admin/products/${productId.value}/unarchive`);
        product.value.isActive = true;
      }
    }
    success.value = true;
  } catch (err: unknown) {
    error.value = (err as { data?: { message?: string } })?.data?.message ?? 'সংরক্ষণ ব্যর্থ হয়েছে।';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="product-edit">
    <div class="product-edit__header">
      <button type="button" class="back-btn" @click="router.back()">← ফিরে যান</button>
      <h2 class="page-title">পণ্য সম্পাদনা</h2>
    </div>

    <div v-if="loading" class="skeleton-form" />
    <div v-else-if="error && !product" class="alert alert--error">{{ error }}</div>

    <form v-else-if="product" class="edit-form" @submit.prevent="save">
      <div v-if="error" class="alert alert--error" role="alert">{{ error }}</div>
      <div v-if="success" class="alert alert--success" role="status">✅ সফলভাবে সংরক্ষণ হয়েছে!</div>

      <div class="form-row">
        <label for="edit-nameBn" class="form-label">নাম (বাংলা) *</label>
        <input id="edit-nameBn" v-model="form.nameBn" type="text" class="form-input" required />
      </div>

      <div class="form-row">
        <label for="edit-nameEn" class="form-label">নাম (ইংরেজি)</label>
        <input id="edit-nameEn" v-model="form.nameEn" type="text" class="form-input" />
      </div>

      <div class="form-row">
        <label for="edit-unit" class="form-label">একক</label>
        <input id="edit-unit" v-model="form.unitLabel" type="text" class="form-input" />
      </div>

      <div class="form-row">
        <label for="edit-sort" class="form-label">সাজানো ক্রম</label>
        <input id="edit-sort" v-model.number="form.sortOrder" type="number" class="form-input" min="0" />
      </div>

      <div class="form-row form-row--checkbox">
        <input id="edit-active" v-model="form.isActive" type="checkbox" class="form-checkbox" />
        <label for="edit-active" class="form-label">সক্রিয়</label>
      </div>

      <!-- Current price info (read-only) -->
      <div class="price-info">
        <span class="price-info__label">আজকের দাম:</span>
        <span class="price-info__value">
          <template v-if="product.minPrice !== null">
            {{ formatTaka(product.minPrice) }}
            <template v-if="product.maxPrice !== null && product.maxPrice !== product.minPrice">
              – {{ formatTaka(product.maxPrice) }}
            </template>
          </template>
          <template v-else>—</template>
        </span>
      </div>

      <div class="form-actions">
        <button type="submit" class="save-btn" :disabled="saving" :aria-busy="saving">
          <span v-if="saving" class="spinner" aria-hidden="true" />
          {{ saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন' }}
        </button>
        <button type="button" class="cancel-btn" @click="router.back()">বাতিল</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.product-edit__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.back-btn {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: var(--text-sm);
  padding: 8px 16px;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}
.back-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-coral-primary);
  border-color: var(--color-coral-border);
}
.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}
.skeleton-form {
  height: 400px;
  border-radius: var(--card-radius, 22px);
  background: #ffffff;
  box-shadow: var(--card-shadow);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
.edit-form {
  max-width: 620px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  padding: 32px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-row--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-input {
  height: 46px;
  padding: 0 16px;
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-bg-canvas);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  outline: none;
  transition: all 0.15s ease;
}
.form-input:focus {
  border-color: var(--color-coral-primary);
  box-shadow: 0 0 0 3px var(--color-coral-subtle);
  background: #ffffff;
}
.form-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--color-coral-primary);
  cursor: pointer;
}
.price-info {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 18px;
  background: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  font-size: var(--text-sm);
}
.price-info__label {
  color: var(--color-text-muted);
  font-weight: 600;
}
.price-info__value {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}
.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}
.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 28px;
  background: var(--color-coral-gradient);
  color: #fff;
  border: none;
  border-radius: 9999px;
  font-weight: 700;
  font-size: var(--text-base);
  cursor: pointer;
  box-shadow: var(--color-coral-glow);
  transition:
    transform 0.18s var(--ease-spring),
    box-shadow 0.18s ease;
}
.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(244, 68, 46, 0.35);
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
.cancel-btn {
  height: 48px;
  padding: 0 22px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border-radius: 9999px;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cancel-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.alert {
  padding: 12px 18px;
  border-radius: 12px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
}
.alert--success {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
  border: 1px solid var(--color-trend-down-border);
}
</style>
