<script setup lang="ts">
import { computed } from 'vue';

export interface CardProps {
  as?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<CardProps>(), {
  as: 'div',
  interactive: false,
  padding: 'md',
});

const classes = computed(() => [
  'ui-card',
  `ui-card--pad-${props.padding}`,
  {
    'ui-card--interactive': props.interactive,
  },
]);
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>

<style scoped>
.ui-card {
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--duration-fast, 150ms) var(--ease-standard),
    box-shadow var(--duration-fast, 150ms) var(--ease-standard),
    border-color var(--duration-fast, 150ms) var(--ease-standard);
  overflow: hidden;
}

.ui-card--pad-none {
  padding: 0;
}
.ui-card--pad-sm {
  padding: var(--space-3, 0.75rem);
}
.ui-card--pad-md {
  padding: var(--space-4, 1rem);
}
.ui-card--pad-lg {
  padding: var(--space-6, 1.5rem);
}

.ui-card--interactive {
  cursor: pointer;
}

.ui-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-strong, #d6cec5);
}

@media (prefers-reduced-motion: reduce) {
  .ui-card--interactive:hover {
    transform: none;
  }
}
</style>
