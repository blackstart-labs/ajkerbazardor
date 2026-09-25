<script setup lang="ts">
import { computed } from 'vue';

export interface NumberInputProps {
  modelValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean;
}

const props = withDefaults(defineProps<NumberInputProps>(), {
  modelValue: null,
  step: 1,
  placeholder: '',
  disabled: false,
  ariaInvalid: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const BANGLA_TO_LATIN: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

function parseNumber(input: string): number | null {
  const latinized = input.replace(/[০-৯]/g, (d) => BANGLA_TO_LATIN[d] ?? d).trim();
  if (latinized === '') return null;
  const num = Number(latinized);
  return Number.isFinite(num) ? num : null;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const val = parseNumber(target.value);
  emit('update:modelValue', val);
}

function stepUp() {
  if (props.disabled) return;
  const current = props.modelValue ?? props.min ?? 0;
  const next = current + props.step;
  if (props.max !== undefined && next > props.max) return;
  emit('update:modelValue', next);
}

function stepDown() {
  if (props.disabled) return;
  const current = props.modelValue ?? 0;
  const next = current - props.step;
  if (props.min !== undefined && next < props.min) return;
  emit('update:modelValue', next);
}

const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return '';
  return String(props.modelValue);
});
</script>

<template>
  <div
    class="ui-number-input"
    :class="{ 'ui-number-input--disabled': disabled, 'ui-number-input--invalid': ariaInvalid }"
  >
    <button
      type="button"
      class="ui-number-input__btn ui-number-input__btn--down"
      aria-label="Decrease value"
      tabindex="-1"
      :disabled="disabled"
      @click="stepDown"
    >
      −
    </button>

    <input
      :id="id"
      type="text"
      inputmode="decimal"
      role="spinbutton"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="ariaInvalid"
      :aria-valuenow="modelValue ?? undefined"
      :aria-valuemin="min"
      :aria-valuemax="max"
      class="ui-number-input__field"
      @input="handleInput"
    />

    <button
      type="button"
      class="ui-number-input__btn ui-number-input__btn--up"
      aria-label="Increase value"
      tabindex="-1"
      :disabled="disabled"
      @click="stepUp"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.ui-number-input {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border-strong, #d6cec5);
  border-radius: var(--radius-md, 10px);
  background-color: var(--color-bg-surface, #ffffff);
  transition:
    border-color var(--duration-fast, 150ms) var(--ease-standard),
    box-shadow var(--duration-fast, 150ms) var(--ease-standard);
  overflow: hidden;
  height: 44px;
}

.ui-number-input:focus-within {
  border-color: var(--color-focus-ring, #d97706);
  box-shadow: 0 0 0 1px var(--color-focus-ring, #d97706);
}

.ui-number-input--invalid {
  border-color: var(--color-trend-up, #b91c1c);
}

.ui-number-input__field {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #1c1917);
  font-family: var(--font-body);
  font-size: var(--text-base, 1rem);
  text-align: center;
  padding: 0 var(--space-2, 0.5rem);
  outline: none;
}

.ui-number-input__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #57534e);
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--duration-fast, 150ms);
}

.ui-number-input__btn:hover:not(:disabled) {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
}

.ui-number-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
