<script setup lang="ts">
// Site-wide header with brand, search, and last update timestamp
import { formatBnDate } from '@ajkerbazardor/shared';

const props = defineProps<{
  latestDate?: string | null;
}>();

const emit = defineEmits<{ (e: 'search', q: string): void }>();
const searchQuery = defineModel<string>('searchQuery', { default: '' });
function onSubmit() {
  emit('search', searchQuery.value.trim());
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <!-- Brand -->
      <NuxtLink to="/" class="site-header__brand" aria-label="আজকের বাজার দর - হোম পেজ">
        <span class="site-header__logo" aria-hidden="true">🛒</span>
        <span class="site-header__title">আজকের বাজার দর</span>
      </NuxtLink>

      <!-- Live date badge -->
      <div v-if="latestDate" class="site-header__date" aria-label="সর্বশেষ আপডেট">
        <span class="site-header__date-label">সর্বশেষ</span>
        <time :datetime="latestDate" class="site-header__date-value">{{ formatBnDate(latestDate) }}</time>
      </div>

      <!-- Search form -->
      <form class="site-header__search" role="search" @submit.prevent="onSubmit">
        <label for="header-search" class="sr-only">পণ্য খুঁজুন</label>
        <input
          id="header-search"
          v-model="searchQuery"
          type="search"
          class="site-header__search-input"
          placeholder="পণ্য খুঁজুন…"
          autocomplete="off"
          @input="onSubmit"
        />
        <button type="submit" class="site-header__search-btn" aria-label="খুঁজুন">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </form>
    </div>
  </header>
</template>

<style scoped>
/* Accessible visually-hidden class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-bg-canvas);
  border-bottom: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-sm);
}

.site-header__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* ── Brand ────────────────────────────────────────────────────────────────── */
.site-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__logo {
  font-size: 1.4rem;
  line-height: 1;
}

.site-header__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* ── Date badge ──────────────────────────────────────────────────────────── */
.site-header__date {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.site-header__date-label {
  color: var(--color-text-muted);
}

.site-header__date-value {
  font-weight: 600;
  color: var(--color-brand-primary);
}

/* ── Search ──────────────────────────────────────────────────────────────── */
.site-header__search {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  margin-left: auto;
  position: relative;
}

.site-header__search-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-8) 0 var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.site-header__search-input::placeholder {
  color: var(--color-text-muted);
}

.site-header__search-input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.site-header__search-btn {
  position: absolute;
  right: var(--space-2-5);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-1);
  transition: color var(--duration-fast);
}

.site-header__search-btn:hover {
  color: var(--color-brand-primary);
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .site-header__date {
    display: none;
  }

  .site-header__title {
    font-size: var(--text-base);
  }
}
</style>
