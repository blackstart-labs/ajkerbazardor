<script setup lang="ts">
import { computed } from 'vue';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

const props = defineProps<FieldProps>();

const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined));
const errorId = computed(() => (props.error ? `${props.id}-error` : undefined));
const ariaDescribedBy = computed(() => {
  const ids: string[] = [];
  if (props.error) ids.push(`${props.id}-error`);
  if (props.hint) ids.push(`${props.id}-hint`);
  return ids.length > 0 ? ids.join(' ') : undefined;
});
</script>

<template>
  <div class="ui-field" :class="{ 'ui-field--error': !!error }">
    <div class="ui-field__header">
      <label :for="id" class="ui-field__label">
        {{ label }}
        <span v-if="required" class="ui-field__required" aria-hidden="true">*</span>
      </label>
      <slot name="action" />
    </div>

    <div class="ui-field__control">
      <slot :id="id" :aria-describedby="ariaDescribedBy" :aria-invalid="!!error" />
    </div>

    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5, 0.375rem);
  font-family: var(--font-body);
}

.ui-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2, 0.5rem);
}

.ui-field__label {
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-text-primary, #1c1917);
  line-height: var(--leading-normal, 1.6);
}

.ui-field__required {
  color: var(--color-trend-up, #b91c1c);
  margin-left: 2px;
}

.ui-field__error {
  margin: 0;
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-trend-up-text, #991b1b);
  line-height: var(--leading-normal, 1.6);
}

.ui-field__hint {
  margin: 0;
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
  line-height: var(--leading-normal, 1.6);
}
</style>
