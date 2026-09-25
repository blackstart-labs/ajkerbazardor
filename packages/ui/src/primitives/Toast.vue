<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

export interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'danger' | 'warning';
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  variant: 'info',
  duration: 4000,
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

let timer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      emit('dismiss');
    }, props.duration);
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div class="ui-toast" :class="`ui-toast--${variant}`" role="status" aria-live="polite">
    <div class="ui-toast__icon" aria-hidden="true">
      <span v-if="variant === 'success'">✓</span>
      <span v-else-if="variant === 'danger'">✕</span>
      <span v-else-if="variant === 'warning'">!</span>
      <span v-else>ℹ</span>
    </div>
    <div class="ui-toast__message">
      {{ message }}
    </div>
    <button type="button" class="ui-toast__close" aria-label="Dismiss notification" @click="emit('dismiss')">✕</button>
  </div>
</template>

<style scoped>
.ui-toast {
  display: flex;
  align-items: center;
  gap: var(--space-3, 0.75rem);
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-lg, 14px);
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  box-shadow: var(--shadow-dropdown);
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-primary, #1c1917);
  max-width: 420px;
  min-width: 280px;
  animation: ui-toast-in var(--duration-fast, 150ms) cubic-bezier(0.2, 0, 0, 1);
}

.ui-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.75rem;
  font-weight: bold;
}

.ui-toast--info .ui-toast__icon {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-secondary, #57534e);
}

.ui-toast--success .ui-toast__icon {
  background-color: var(--color-trend-down-bg, #f0fdf4);
  color: var(--color-trend-down, #15803d);
}

.ui-toast--danger .ui-toast__icon {
  background-color: var(--color-trend-up-bg, #fef2f2);
  color: var(--color-trend-up, #b91c1c);
}

.ui-toast--warning .ui-toast__icon {
  background-color: #fffbeb;
  color: #b45309;
}

.ui-toast__message {
  flex: 1;
  line-height: var(--leading-normal, 1.6);
}

.ui-toast__close {
  border: none;
  background: transparent;
  color: var(--color-text-muted, #78716c);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.875rem;
}

.ui-toast__close:hover {
  color: var(--color-text-primary, #1c1917);
}

@keyframes ui-toast-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
