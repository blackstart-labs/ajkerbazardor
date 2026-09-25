<script setup lang="ts">
export interface CategoryItem {
  id: number;
  slug: string;
  nameBn: string;
}

export interface CategoryNavProps {
  categories: CategoryItem[];
  activeSlug?: string | null;
}

withDefaults(defineProps<CategoryNavProps>(), {
  activeSlug: null,
});

const emit = defineEmits<{
  (e: 'select', slug: string | null): void;
}>();
</script>

<template>
  <nav class="ui-category-nav" aria-label="Product categories">
    <div class="ui-category-nav__scroll">
      <button
        type="button"
        class="ui-category-nav__pill"
        :class="{ 'ui-category-nav__pill--active': activeSlug === null }"
        :aria-current="activeSlug === null ? 'page' : undefined"
        @click="emit('select', null)"
      >
        সব পণ্য
      </button>

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="ui-category-nav__pill"
        :class="{ 'ui-category-nav__pill--active': activeSlug === cat.slug }"
        :aria-current="activeSlug === cat.slug ? 'page' : undefined"
        @click="emit('select', cat.slug)"
      >
        {{ cat.nameBn }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.ui-category-nav {
  width: 100%;
  background-color: var(--color-bg-canvas, #faf7f2);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.ui-category-nav__scroll {
  display: flex;
  gap: var(--space-2, 0.5rem);
  overflow-x: auto;
  padding: var(--space-2-5, 0.625rem) var(--space-4, 1rem);
  scrollbar-width: none;
}

.ui-category-nav__scroll::-webkit-scrollbar {
  display: none;
}

.ui-category-nav__pill {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 0.35rem 0.875rem;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  background-color: var(--color-bg-surface, #ffffff);
  color: var(--color-text-secondary, #57534e);
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) var(--ease-standard);
  min-height: 36px;
  user-select: none;
}

.ui-category-nav__pill:hover:not(.ui-category-nav__pill--active) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
  border-color: var(--color-border-strong, #d6cec5);
}

.ui-category-nav__pill--active {
  background-color: var(--color-brand-primary, #d97706);
  color: #ffffff;
  border-color: var(--color-brand-primary, #d97706);
  font-weight: 600;
}

.ui-category-nav__pill:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}
</style>
