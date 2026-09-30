<script setup lang="ts">
// Site-wide header with brand, search, and last update timestamp
import { formatBnDate } from '@ajkerbazardor/shared';

const props = defineProps<{
  latestDate?: string | null;
  transparent?: boolean;
}>();

const emit = defineEmits<{ (e: 'search', q: string): void }>();
const searchQuery = defineModel<string>('searchQuery', { default: '' });
function onSubmit() {
  emit('search', searchQuery.value.trim());
}
</script>

<template>
  <header class="site-header" :class="{ 'site-header--transparent': transparent }">
    <div class="site-header__inner">
      <!-- Brand -->
      <NuxtLink to="/" class="site-header__brand" aria-label="আজকের বাজার দর - হোম পেজ">
        <span class="site-header__logo" aria-hidden="true">🛒</span>
        <span class="site-header__title">আজকের বাজার দর</span>
      </NuxtLink>

      <!-- Navigation links -->
      <nav class="site-header__nav" aria-label="প্রধান নেভিগেশন">
        <NuxtLink to="/prices" class="site-header__nav-link">বাজারদর</NuxtLink>
        <NuxtLink to="/markets" class="site-header__nav-link">বাজার</NuxtLink>
        <NuxtLink to="/changes" class="site-header__nav-link">পরিবর্তন</NuxtLink>
        <NuxtLink to="/about" class="site-header__nav-link">উৎস ও পদ্ধতি</NuxtLink>
      </nav>

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

.site-header--transparent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: none;
}

.site-header--transparent .site-header__title {
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.site-header--transparent .site-header__date-label {
  color: #cbd5e1;
}

.site-header--transparent .site-header__date-value {
  color: #34d399;
}

.site-header--transparent .site-header__search-input {
  background-color: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.site-header--transparent .site-header__search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.site-header--transparent .site-header__search-input:focus {
  background-color: rgba(255, 255, 255, 0.22);
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.25);
}

.site-header--transparent .site-header__search-btn {
  color: rgba(255, 255, 255, 0.85);
}

.site-header--transparent .site-header__search-btn:hover {
  color: #34d399;
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

/* ── Navigation Links ─────────────────────────────────────────────────── */
.site-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: var(--space-2);
}

.site-header__nav-link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  text-decoration: none;
  white-space: nowrap;
  transition: all var(--duration-fast);
}

.site-header__nav-link:hover,
.site-header__nav-link.router-link-active {
  color: var(--color-brand-primary);
  background-color: var(--color-bg-subtle);
  text-decoration: none;
}

.site-header--transparent .site-header__nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.site-header--transparent .site-header__nav-link:hover,
.site-header--transparent .site-header__nav-link.router-link-active {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
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
  max-width: 320px;
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
@media (max-width: 980px) {
  .site-header__date {
    display: none;
  }
}

@media (max-width: 768px) {
  .site-header__nav {
    display: none;
  }
}

@media (max-width: 640px) {
  .site-header__title {
    font-size: var(--text-base);
  }
}
</style>
