<script setup lang="ts">
import { computed } from 'vue';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const classes = computed(() => [
  'ui-button',
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  {
    'ui-button--disabled': props.disabled || props.loading,
    'ui-button--loading': props.loading,
  },
]);

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading" @click="handleClick">
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true">
      <svg class="ui-spinner-svg" viewBox="0 0 24 24" fill="none">
        <circle class="ui-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      </svg>
    </span>
    <span class="ui-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2, 0.5rem);
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: var(--radius-md, 10px);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--duration-fast, 150ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1));
  user-select: none;
  min-height: var(--touch-target-min, 44px);
  min-width: var(--touch-target-min, 44px);
  padding: 0 var(--space-4, 1rem);
  font-size: var(--text-base, 1rem);
  line-height: 1.25;
}

.ui-button:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}

/* ── Sizes ───────────────────────────────────────────────────────────────── */
.ui-button--sm {
  font-size: var(--text-sm, 0.875rem);
  padding: 0 var(--space-3, 0.75rem);
  min-height: 36px;
  border-radius: var(--radius-sm, 6px);
}

.ui-button--md {
  font-size: var(--text-base, 1rem);
  padding: 0 var(--space-4, 1rem);
  min-height: 44px;
}

.ui-button--lg {
  font-size: var(--text-lg, 1.125rem);
  padding: 0 var(--space-6, 1.5rem);
  min-height: 50px;
  border-radius: var(--radius-lg, 14px);
}

/* ── Variants ────────────────────────────────────────────────────────────── */
.ui-button--primary {
  background-color: var(--color-brand-primary, #d97706);
  color: #ffffff;
}
.ui-button--primary:hover:not(:disabled) {
  background-color: var(--color-brand-hover, #b45309);
}

.ui-button--secondary {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
  border-color: var(--color-border-subtle, #e7e0d8);
}
.ui-button--secondary:hover:not(:disabled) {
  background-color: var(--color-bg-muted, #ebe5df);
}

.ui-button--outline {
  background-color: transparent;
  color: var(--color-text-primary, #1c1917);
  border-color: var(--color-border-strong, #d6cec5);
}
.ui-button--outline:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
}

.ui-button--ghost {
  background-color: transparent;
  color: var(--color-text-secondary, #57534e);
}
.ui-button--ghost:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-button--danger {
  background-color: var(--color-trend-up-bg, #fef2f2);
  color: var(--color-trend-up, #b91c1c);
  border-color: var(--color-trend-up-border, #fca5a5);
}
.ui-button--danger:hover:not(:disabled) {
  background-color: var(--color-trend-up, #b91c1c);
  color: #ffffff;
}

/* ── Disabled & Loading ──────────────────────────────────────────────────── */
.ui-button--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

.ui-button__spinner {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
  animation: ui-spin 0.75s linear infinite;
}

.ui-spinner-svg {
  width: 100%;
  height: 100%;
}

.ui-spinner-circle {
  stroke-dasharray: 40;
  stroke-dashoffset: 15;
  stroke-linecap: round;
}

@keyframes ui-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
