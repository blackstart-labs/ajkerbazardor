<script setup lang="ts">
import { computed } from 'vue';

export interface IconButtonProps {
  ariaLabel: string;
  variant?: 'ghost' | 'outline' | 'surface' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<IconButtonProps>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const classes = computed(() => [
  'ui-icon-button',
  `ui-icon-button--${props.variant}`,
  `ui-icon-button--${props.size}`,
  {
    'ui-icon-button--disabled': props.disabled,
  },
]);
</script>

<template>
  <button type="button" :class="classes" :aria-label="ariaLabel" :disabled="disabled" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<style scoped>
.ui-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 10px);
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
  color: var(--color-text-secondary, #57534e);
  transition: all var(--duration-fast, 150ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1));
  min-width: var(--touch-target-min, 44px);
  min-height: var(--touch-target-min, 44px);
  padding: var(--space-2, 0.5rem);
}

.ui-icon-button:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}

.ui-icon-button--sm {
  min-width: 36px;
  min-height: 36px;
  padding: var(--space-1-5, 0.375rem);
}

.ui-icon-button--md {
  min-width: 44px;
  min-height: 44px;
}

.ui-icon-button--lg {
  min-width: 52px;
  min-height: 52px;
}

.ui-icon-button--ghost:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-icon-button--outline {
  border-color: var(--color-border-subtle, #e7e0d8);
}
.ui-icon-button--outline:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-icon-button--surface {
  background-color: var(--color-bg-surface, #ffffff);
  border-color: var(--color-border-subtle, #e7e0d8);
  box-shadow: var(--shadow-sm);
}
.ui-icon-button--surface:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-icon-button--primary {
  background-color: var(--color-brand-primary, #d97706);
  color: #ffffff;
}
.ui-icon-button--primary:hover:not(:disabled) {
  background-color: var(--color-brand-hover, #b45309);
}

.ui-icon-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
