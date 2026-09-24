<script setup lang="ts">
import { computed } from 'vue';

export interface ChipProps {
  active?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<ChipProps>(), {
  active: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const classes = computed(() => [
  'ui-chip',
  {
    'ui-chip--active': props.active,
    'ui-chip--disabled': props.disabled,
  },
]);
</script>

<template>
  <button type="button" :class="classes" :disabled="disabled" :aria-pressed="active" @click="emit('click', $event)">
    <slot name="prefix" />
    <span class="ui-chip__label">
      <slot />
    </span>
    <slot name="suffix" />
  </button>
</template>

<style scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5, 0.375rem);
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  background-color: var(--color-bg-surface, #ffffff);
  color: var(--color-text-secondary, #57534e);
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1));
  user-select: none;
  min-height: 38px;
  white-space: nowrap;
}

.ui-chip:hover:not(:disabled):not(.ui-chip--active) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
  border-color: var(--color-border-strong, #d6cec5);
}

.ui-chip--active {
  background-color: var(--color-brand-subtle, #fef3c7);
  color: var(--color-brand-ink, #78350f);
  border-color: var(--color-brand-primary, #d97706);
  font-weight: 600;
}

.ui-chip:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}

.ui-chip--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
