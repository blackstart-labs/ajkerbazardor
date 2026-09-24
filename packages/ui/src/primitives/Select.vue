<script setup lang="ts">
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  modelValue?: string | number;
  options: SelectOption[];
  id?: string;
  disabled?: boolean;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
}

withDefaults(defineProps<SelectProps>(), {
  modelValue: '',
  disabled: false,
  ariaInvalid: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div
    class="ui-select-wrapper"
    :class="{ 'ui-select-wrapper--disabled': disabled, 'ui-select-wrapper--invalid': ariaInvalid }"
  >
    <select
      :id="id"
      class="ui-select"
      :value="modelValue"
      :disabled="disabled"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="ariaInvalid"
      @change="handleChange"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
        {{ opt.label }}
      </option>
    </select>
    <span class="ui-select__arrow" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.ui-select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.ui-select {
  appearance: none;
  width: 100%;
  height: 44px;
  padding: 0 var(--space-8, 2rem) 0 var(--space-3, 0.75rem);
  font-family: var(--font-body);
  font-size: var(--text-base, 1rem);
  color: var(--color-text-primary, #1c1917);
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-strong, #d6cec5);
  border-radius: var(--radius-md, 10px);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--duration-fast, 150ms),
    box-shadow var(--duration-fast, 150ms);
}

.ui-select:focus-visible {
  border-color: var(--color-focus-ring, #d97706);
  box-shadow: 0 0 0 1px var(--color-focus-ring, #d97706);
}

.ui-select-wrapper--invalid .ui-select {
  border-color: var(--color-trend-up, #b91c1c);
}

.ui-select__arrow {
  position: absolute;
  right: var(--space-3, 0.75rem);
  pointer-events: none;
  color: var(--color-text-secondary, #57534e);
  display: flex;
  align-items: center;
}

.ui-select-wrapper--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ui-select-wrapper--disabled select {
  cursor: not-allowed;
}
</style>
