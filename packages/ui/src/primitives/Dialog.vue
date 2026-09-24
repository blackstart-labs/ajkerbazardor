<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

export interface DialogProps {
  open?: boolean;
  title?: string | undefined;
}

const props = withDefaults(defineProps<DialogProps>(), {
  open: false,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'close'): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

function close() {
  emit('update:open', false);
  emit('close');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    event.preventDefault();
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!dialogRef.value) return;
    if (isOpen) {
      if (!dialogRef.value.open) {
        dialogRef.value.showModal();
      }
    } else {
      if (dialogRef.value.open) {
        dialogRef.value.close();
      }
    }
  },
);

onMounted(() => {
  if (props.open && dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal();
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <dialog
    ref="dialogRef"
    class="ui-dialog"
    :aria-label="title"
    @click="(e: MouseEvent) => e.target === dialogRef && close()"
  >
    <div class="ui-dialog__panel" @click.stop>
      <header v-if="title || $slots.header" class="ui-dialog__header">
        <slot name="header">
          <h2 class="ui-dialog__title">{{ title }}</h2>
        </slot>
        <button type="button" class="ui-dialog__close" aria-label="Close dialog" @click="close">✕</button>
      </header>

      <div class="ui-dialog__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="ui-dialog__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.ui-dialog {
  border: none;
  background: transparent;
  padding: var(--space-4, 1rem);
  max-width: 520px;
  width: calc(100% - 2rem);
  color: var(--color-text-primary, #1c1917);
}

.ui-dialog::backdrop {
  background-color: rgba(20, 18, 16, 0.45);
  backdrop-filter: blur(2px);
  animation: ui-fade-in var(--duration-fast, 150ms) ease-out;
}

.ui-dialog__panel {
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-xl, 20px);
  box-shadow: var(--shadow-dropdown);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ui-scale-in var(--duration-fast, 150ms) cubic-bezier(0.2, 0, 0, 1);
}

.ui-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
}

.ui-dialog__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  margin: 0;
  line-height: var(--leading-tight, 1.25);
}

.ui-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full, 9999px);
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #57534e);
  cursor: pointer;
  font-size: 1rem;
  transition: background-color var(--duration-fast, 150ms);
}

.ui-dialog__close:hover {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-dialog__body {
  padding: var(--space-5, 1.25rem);
  line-height: var(--leading-normal, 1.6);
  font-family: var(--font-body);
}

.ui-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3, 0.75rem);
  padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
  background-color: var(--color-bg-subtle, #f4efeb);
  border-top: 1px solid var(--color-border-subtle, #e7e0d8);
}

@keyframes ui-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes ui-scale-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
