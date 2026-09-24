<script setup lang="ts">
export interface EmptyStateProps {
  title: string;
  description?: string;
}

defineProps<EmptyStateProps>();
</script>

<template>
  <div class="ui-empty-state">
    <div v-if="$slots.icon" class="ui-empty-state__icon">
      <slot name="icon" />
    </div>

    <h3 class="ui-empty-state__title">{{ title }}</h3>

    <p v-if="description" class="ui-empty-state__desc">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="ui-empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8, 2rem) var(--space-4, 1rem);
  color: var(--color-text-secondary, #57534e);
}

.ui-empty-state__icon {
  margin-bottom: var(--space-3, 0.75rem);
  color: var(--color-text-muted, #78716c);
}

.ui-empty-state__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  color: var(--color-text-primary, #1c1917);
  margin: 0 0 var(--space-1-5, 0.375rem) 0;
  line-height: var(--leading-tight, 1.25);
}

.ui-empty-state__desc {
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-secondary, #57534e);
  margin: 0 0 var(--space-4, 1rem) 0;
  max-width: 360px;
  line-height: var(--leading-normal, 1.6);
}

.ui-empty-state__action {
  margin-top: var(--space-2, 0.5rem);
}
</style>
