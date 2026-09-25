<script setup lang="ts">
import { ref } from 'vue';

export interface FileDropzoneProps {
  accept?: string;
  maxSizeBytes?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<FileDropzoneProps>(), {
  accept: '.xlsx,.xls',
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  disabled: false,
});

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
  (e: 'error', message: string): void;
}>();

const isDragging = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function handleFile(file: File) {
  if (file.size > props.maxSizeBytes) {
    emit('error', 'ফাইল সাইজ খুব বড় (সর্বোচ্চ ১০ এমবি)');
    return;
  }
  emit('file-selected', file);
}

function handleDrop(event: DragEvent) {
  if (props.disabled) return;
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const [file] = files;
    if (file) handleFile(file);
  }
}

function handleDragOver(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    const [file] = files;
    if (file) handleFile(file);
  }
}

function openFileDialog() {
  if (props.disabled || !inputRef.value) return;
  inputRef.value.click();
}
</script>

<template>
  <div
    class="ui-dropzone"
    :class="{
      'ui-dropzone--active': isDragging,
      'ui-dropzone--disabled': disabled,
    }"
    role="button"
    tabindex="0"
    aria-label="Upload TCB spreadsheet file"
    @click="openFileDialog"
    @keydown.enter="openFileDialog"
    @keydown.space.prevent="openFileDialog"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      ref="inputRef"
      type="file"
      class="ui-dropzone__input"
      :accept="accept"
      :disabled="disabled"
      @change="handleChange"
    />

    <div class="ui-dropzone__icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>

    <div class="ui-dropzone__content">
      <p class="ui-dropzone__title">
        <slot name="title"> TCB .xlsx ফাইল Drag & Drop করুন অথবা Browse করুন </slot>
      </p>
      <p class="ui-dropzone__subtitle">
        <slot name="subtitle"> সর্বোচ্চ ফাইল সাইজ: ১০ এমবি </slot>
      </p>
    </div>
  </div>
</template>

<style scoped>
.ui-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3, 0.75rem);
  padding: var(--space-8, 2rem) var(--space-4, 1rem);
  border: 2px dashed var(--color-border-strong, #d6cec5);
  border-radius: var(--radius-xl, 20px);
  background-color: var(--color-bg-subtle, #f4efeb);
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) var(--ease-standard);
  text-align: center;
}

.ui-dropzone:hover:not(.ui-dropzone--disabled) {
  border-color: var(--color-brand-primary, #d97706);
  background-color: var(--color-bg-surface, #ffffff);
}

.ui-dropzone:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}

.ui-dropzone--active {
  border-color: var(--color-brand-primary, #d97706);
  background-color: var(--color-brand-subtle, #fef3c7);
}

.ui-dropzone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-dropzone__input {
  display: none;
}

.ui-dropzone__icon {
  color: var(--color-brand-primary, #d97706);
}

.ui-dropzone__title {
  margin: 0 0 var(--space-1, 0.25rem) 0;
  font-family: var(--font-heading);
  font-size: var(--text-base, 1rem);
  font-weight: 600;
  color: var(--color-text-primary, #1c1917);
}

.ui-dropzone__subtitle {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
}
</style>
