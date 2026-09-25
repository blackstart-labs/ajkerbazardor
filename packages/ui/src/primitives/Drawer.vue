<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

export interface DrawerProps {
  open?: boolean;
  position?: 'bottom' | 'left' | 'right';
  title?: string;
}

const props = withDefaults(defineProps<DrawerProps>(), {
  open: false,
  position: 'bottom',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'close'): void;
}>();

function close() {
  emit('update:open', false);
  emit('close');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ui-drawer-overlay" aria-modal="true" role="dialog" :aria-label="title" @click="close">
      <div class="ui-drawer" :class="`ui-drawer--${position}`" @click.stop>
        <div v-if="position === 'bottom'" class="ui-drawer__drag-handle" aria-hidden="true" />

        <header v-if="title || $slots.header" class="ui-drawer__header">
          <slot name="header">
            <h3 class="ui-drawer__title">{{ title }}</h3>
          </slot>
          <button type="button" class="ui-drawer__close" aria-label="Close" @click="close">✕</button>
        </header>

        <div class="ui-drawer__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="ui-drawer__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(20, 18, 16, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
}

.ui-drawer {
  background-color: var(--color-bg-surface, #ffffff);
  box-shadow: var(--shadow-dropdown);
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary, #1c1917);
  transition: transform var(--duration-normal, 250ms) var(--ease-standard);
}

.ui-drawer--bottom {
  margin-top: auto;
  width: 100%;
  max-height: 85vh;
  border-top-left-radius: var(--radius-xl, 20px);
  border-top-right-radius: var(--radius-xl, 20px);
  border-top: 1px solid var(--color-border-subtle, #e7e0d8);
  animation: ui-slide-up var(--duration-normal, 250ms) cubic-bezier(0.2, 0, 0, 1);
}

.ui-drawer--left {
  margin-right: auto;
  height: 100%;
  width: 320px;
  max-width: 90vw;
  border-right: 1px solid var(--color-border-subtle, #e7e0d8);
  animation: ui-slide-right var(--duration-normal, 250ms) cubic-bezier(0.2, 0, 0, 1);
}

.ui-drawer--right {
  margin-left: auto;
  height: 100%;
  width: 360px;
  max-width: 90vw;
  border-left: 1px solid var(--color-border-subtle, #e7e0d8);
  animation: ui-slide-left var(--duration-normal, 250ms) cubic-bezier(0.2, 0, 0, 1);
}

.ui-drawer__drag-handle {
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--color-border-strong, #d6cec5);
  margin: var(--space-2, 0.5rem) auto 0;
}

.ui-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
}

.ui-drawer__title {
  font-family: var(--font-heading);
  font-size: var(--text-base, 1rem);
  font-weight: 600;
  margin: 0;
}

.ui-drawer__close {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #57534e);
  cursor: pointer;
  border-radius: var(--radius-full, 9999px);
  font-size: 1rem;
}

.ui-drawer__body {
  padding: var(--space-4, 1rem);
  overflow-y: auto;
  flex: 1;
  font-family: var(--font-body);
  line-height: var(--leading-normal, 1.6);
}

.ui-drawer__footer {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-top: 1px solid var(--color-border-subtle, #e7e0d8);
  background-color: var(--color-bg-subtle, #f4efeb);
}

@keyframes ui-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes ui-slide-left {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes ui-slide-right {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
