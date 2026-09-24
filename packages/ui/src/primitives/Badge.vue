<script setup lang="ts">
import { computed } from 'vue';

export interface BadgeProps {
  variant?: 'neutral' | 'brand' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'neutral',
  size: 'md',
});

const classes = computed(() => ['ui-badge', `ui-badge--${props.variant}`, `ui-badge--${props.size}`]);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid transparent;
  line-height: 1;
  white-space: nowrap;
}

.ui-badge--sm {
  font-size: var(--text-xs, 0.75rem);
  padding: 0.2rem 0.5rem;
}

.ui-badge--md {
  font-size: var(--text-sm, 0.875rem);
  padding: 0.25rem 0.625rem;
}

.ui-badge--neutral {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-secondary, #57534e);
  border-color: var(--color-border-subtle, #e7e0d8);
}

.ui-badge--brand {
  background-color: var(--color-brand-subtle, #fef3c7);
  color: var(--color-brand-ink, #78350f);
  border-color: var(--color-brand-border, #fde68a);
}

.ui-badge--success {
  background-color: var(--color-trend-down-bg, #f0fdf4);
  color: var(--color-trend-down-text, #166534);
  border-color: var(--color-trend-down-border, #86efac);
}

.ui-badge--danger {
  background-color: var(--color-trend-up-bg, #fef2f2);
  color: var(--color-trend-up-text, #991b1b);
  border-color: var(--color-trend-up-border, #fca5a5);
}

.ui-badge--warning {
  background-color: #fffbeb;
  color: #92400e;
  border-color: #fcd34d;
}
</style>
